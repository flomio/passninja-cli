package cmd

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/flomio/passninja-cli/pkg/oauth"
	"github.com/flomio/passninja-cli/pkg/output"
	"github.com/flomio/passninja-cli/pkg/session"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
	"golang.org/x/term"
)

var (
	flagLoginDevice    bool
	flagLoginNoBrowser bool
	flagAuthURL        string
)

var loginCmd = &cobra.Command{
	Use:   "login",
	Short: "Log in through your browser (no API key stored on disk)",
	Long: `Opens www.passninja.com in your browser to sign in. If the browser is
already signed in to PassNinja, no password is asked. The CLI then holds a
login session in your OS keychain — never your account API key.

The session's access token refreshes automatically; the session itself ends
30 days after login, after which you log in again. ` + "`passninja logout`" + ` ends
it immediately on this machine and on the server.

Use --device on a machine without a browser (SSH, containers): it shows a
code to enter at auth.passninja.com/oauth/device from any other device.

For CI and scripts, keep using PASSNINJA_API_KEY + PASSNINJA_ACCOUNT_ID.`,
	RunE: func(cmd *cobra.Command, _ []string) error {
		if _, err := runLogin(cmd.Context(), loginOptions{
			device:      flagLoginDevice,
			openBrowser: !flagLoginNoBrowser,
		}); err != nil {
			return err
		}
		reportLegacyAuthFile()
		return nil
	},
}

var logoutCmd = &cobra.Command{
	Use:   "logout",
	Short: "End the browser-login session on this machine and on the server",
	RunE: func(cmd *cobra.Command, _ []string) error {
		s, err := session.Load()
		if err != nil {
			// An unreadable session can't be revoked, but it must still be
			// removable — otherwise it blocks every command.
			output.Warn("Stored session is unreadable (%v); removing it.", err)
			return session.Delete()
		}
		if s == nil {
			output.Info("Not logged in.")
			return nil
		}
		ctx, cancel := context.WithTimeout(cmd.Context(), 15*time.Second)
		defer cancel()
		cfg := oauth.Config{AuthURL: s.AuthURL, HTTPClient: &http.Client{Timeout: 15 * time.Second}}
		if cfg.AuthURL == "" {
			cfg.AuthURL = oauth.DefaultAuthURL
		}
		revokeErr := cfg.Revoke(ctx, s)
		if err := session.Delete(); err != nil {
			return err
		}
		if revokeErr != nil {
			// The local copy is gone either way; say the server copy may
			// still be live until it expires.
			output.Warn("Removed the local session, but the server could not be reached to revoke it (%v).", revokeErr)
			output.Warn("It expires on its own within the hour; refresh is impossible without the deleted token.")
			return nil
		}
		output.Success("Logged out.")
		return nil
	},
}

func init() {
	loginCmd.Flags().BoolVar(&flagLoginDevice, "device", false, "log in with a code entered on another device (for SSH / headless hosts)")
	loginCmd.Flags().BoolVar(&flagLoginNoBrowser, "no-browser", false, "print the login URL instead of opening a browser")
	loginCmd.Flags().StringVar(&flagAuthURL, "auth-url", "", "authorization server (default derived from --base-url, else https://auth.passninja.com)")
	rootCmd.AddCommand(loginCmd)
	rootCmd.AddCommand(logoutCmd)
}

type loginOptions struct {
	device      bool
	openBrowser bool
	// quietSuccess skips the "Logged in" line, for an auto-login that is
	// about to run the command the user actually typed.
	quietSuccess bool
}

// loginConfig resolves which authorization server and API a new login is
// for: explicit flags, then config/env, then production.
func loginConfig() oauth.Config {
	baseURL := flagBaseURL
	if baseURL == "" {
		baseURL = viper.GetString("base_url")
	}
	authURL := flagAuthURL
	if authURL == "" {
		authURL = viper.GetString("auth_url")
	}
	if authURL == "" {
		authURL = oauth.AuthURLFor(baseURL)
	}
	return oauth.Config{
		AuthURL:    authURL,
		BaseURL:    baseURL,
		HTTPClient: &http.Client{Timeout: 30 * time.Second},
	}
}

// runLogin performs a browser (or device) login and stores the session.
// All prompts go to stderr so a command's stdout stays clean for pipes.
func runLogin(ctx context.Context, opts loginOptions) (*session.Session, error) {
	cfg := loginConfig()
	var (
		s   *session.Session
		err error
	)
	if opts.device {
		s, err = cfg.DeviceLogin(ctx, func(dc *oauth.DeviceCode) {
			fmt.Fprintf(os.Stderr, "\nTo log in, open %s on any device\nand enter the code:  %s\n\n",
				dc.VerificationURI, dc.UserCode)
			fmt.Fprintf(os.Stderr, "Or open: %s\n\nWaiting for confirmation…\n", dc.VerificationURIComplete)
		})
	} else {
		s, err = cfg.BrowserLogin(ctx, opts.openBrowser, func(u string) {
			if opts.openBrowser {
				fmt.Fprintf(os.Stderr, "Opening your browser to log in to PassNinja…\n")
				fmt.Fprintf(os.Stderr, "If it doesn't open, visit:\n  %s\n\n", u)
			} else {
				fmt.Fprintf(os.Stderr, "Open this URL in a browser on this machine to log in:\n  %s\n\n", u)
			}
			fmt.Fprintf(os.Stderr, "Waiting for login… (on a machine without a browser, use `passninja login --device`)\n")
		})
	}
	if err != nil {
		return nil, fmt.Errorf("login failed: %w", err)
	}
	where, err := session.Save(s)
	if err != nil {
		return nil, fmt.Errorf("save session: %w", err)
	}
	if !opts.quietSuccess {
		output.Success("Logged in to %s. Session stored in %s; it ends %s.",
			s.AccountID, where, s.SessionExpiresAt.Local().Format("Jan 2, 2006"))
	} else {
		fmt.Fprintf(os.Stderr, "Logged in to %s.\n\n", s.AccountID)
	}
	if where != "keychain" {
		output.Warn("No OS keychain available; the session is in %s (mode 0600).", where)
	}
	return s, nil
}

// reportLegacyAuthFile points out a leftover ~/.passninja-auth.json: it
// still holds the account API key in plaintext, and it now loses to the
// login session anyway.
func reportLegacyAuthFile() {
	home, err := os.UserHomeDir()
	if err != nil {
		return
	}
	path := home + string(os.PathSeparator) + ".passninja-auth.json"
	if _, err := os.Stat(path); err == nil {
		output.Warn("%s still holds an API key in plaintext and is no longer needed.", path)
		output.Warn("Delete it with: rm %s", path)
	}
}

// interactive reports whether we can run a browser login mid-command:
// a human at a terminal on both ends. False under pipes, CI, and the MCP
// stdio transport (whose stdin is the protocol stream).
func interactive() bool {
	return term.IsTerminal(int(os.Stdin.Fd())) && term.IsTerminal(int(os.Stderr.Fd()))
}
