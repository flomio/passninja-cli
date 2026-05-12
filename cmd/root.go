// Package cmd implements the Cobra command tree for the passninja CLI.
// cmd/root.go is the entry point — it wires persistent flags, resolves
// credentials, and stores an *api.Client on cmd.Context() for downstream
// handlers to pull via clientFromContext().
package cmd

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/flomio/passninja-cli/pkg/api"
	"github.com/flomio/passninja-cli/pkg/auth"
	"github.com/flomio/passninja-cli/pkg/config"
	"github.com/flomio/passninja-cli/pkg/output"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var (
	flagJSON      bool
	flagPlaintext bool
	flagConfig    string
	flagAPIKey    string
	flagAccountID string
	flagBaseURL   string
	flagDebug     bool

	buildVersion = "dev"
	buildCommit  = "unknown"
	buildDate    = "unknown"
)

// SetBuildInfo is called from main.go to inject ldflag-baked version data.
func SetBuildInfo(version, commit, date string) {
	buildVersion = version
	buildCommit = commit
	buildDate = date
}

type ctxKey int

const clientKey ctxKey = 1

var rootCmd = &cobra.Command{
	Use:           "passninja",
	Short:         "Command-line interface for the PassNinja API",
	Long:          "passninja wraps the PassNinja REST API for pass templates, passes, and webhooks.",
	SilenceUsage:  true,
	SilenceErrors: true,
	PersistentPreRunE: func(cmd *cobra.Command, _ []string) error {
		if err := config.Setup(flagConfig); err != nil {
			return err
		}
		output.SetMode(output.Resolve(flagJSON, flagPlaintext, viper.GetString("default_output")))

		// `auth`, `version`, and the implicit `help` / `completion` commands
		// don't need a client — skip credential resolution.
		switch cmd.Name() {
		case "auth", "version", "help", "completion":
			return nil
		}

		client, err := buildClient()
		if err != nil {
			return err
		}
		ctx := context.WithValue(cmd.Context(), clientKey, client)
		cmd.SetContext(ctx)
		return nil
	},
}

// Execute runs the root command. Returns the error so main() can set the
// exit code; the error itself is printed by the global handler below.
func Execute() error {
	rootCmd.SetOut(os.Stdout)
	rootCmd.SetErr(os.Stderr)
	err := rootCmd.ExecuteContext(context.Background())
	if err != nil {
		printError(err)
	}
	return err
}

func init() {
	rootCmd.PersistentFlags().BoolVar(&flagJSON, "json", false, "output as pretty-printed JSON")
	rootCmd.PersistentFlags().BoolVar(&flagPlaintext, "plaintext", false, "output as tab-separated text (no decoration)")
	rootCmd.PersistentFlags().StringVar(&flagConfig, "config", "", "config file (default ~/.passninja.yaml)")
	rootCmd.PersistentFlags().StringVar(&flagAPIKey, "api-key", "", "PassNinja API key (overrides env / auth file)")
	rootCmd.PersistentFlags().StringVar(&flagAccountID, "account-id", "", "Account ID, e.g. aid_0x002 (overrides env / auth file)")
	rootCmd.PersistentFlags().StringVar(&flagBaseURL, "base-url", "", "API base URL (default https://api.passninja.com/v1)")
	rootCmd.PersistentFlags().BoolVar(&flagDebug, "debug", false, "print HTTP request/response details to stderr")

	_ = viper.BindPFlag("debug", rootCmd.PersistentFlags().Lookup("debug"))
}

// buildClient resolves the credential trio (flag > env > auth file > yaml)
// and returns a configured *api.Client.
func buildClient() (*api.Client, error) {
	apiKey := flagAPIKey
	accountID := flagAccountID
	baseURL := flagBaseURL

	if apiKey == "" {
		apiKey = viper.GetString("api_key")
	}
	if accountID == "" {
		accountID = viper.GetString("account_id")
	}
	if baseURL == "" {
		baseURL = viper.GetString("base_url")
	}

	if apiKey == "" || accountID == "" {
		// Fall back to the on-disk auth file.
		creds, err := auth.Load()
		if err != nil {
			return nil, err
		}
		if creds != nil {
			if apiKey == "" {
				apiKey = creds.APIKey
			}
			if accountID == "" {
				accountID = creds.AccountID
			}
			if baseURL == "" {
				baseURL = creds.BaseURL
			}
		}
	}

	if apiKey == "" || accountID == "" {
		return nil, fmt.Errorf("missing credentials. Run `passninja auth` or set PASSNINJA_API_KEY and PASSNINJA_ACCOUNT_ID")
	}

	httpClient := &http.Client{Timeout: 30 * time.Second}
	return api.NewClient(
		apiKey,
		accountID,
		api.WithHTTPClient(httpClient),
		api.WithBaseURL(baseURL),
		api.WithUserAgent("passninja-cli/"+buildVersion),
		api.WithDebug(flagDebug || viper.GetBool("debug")),
	), nil
}

func clientFromContext(ctx context.Context) (*api.Client, error) {
	c, ok := ctx.Value(clientKey).(*api.Client)
	if !ok || c == nil {
		return nil, fmt.Errorf("internal: API client missing from context (run `passninja auth` first?)")
	}
	return c, nil
}

// printError renders the final error in a user-friendly form, with hints for
// the well-known classes (401, 403/ENTERPRISE_REQUIRED, 404).
func printError(err error) {
	switch {
	case api.IsAuth(err):
		output.Error("%v", err)
		output.Error("API key rejected. Run `passninja auth` to update credentials.")
	case api.IsEnterpriseRequired(err):
		output.Error("%v", err)
		output.Error("This command requires an enterprise account. Contact sales to upgrade.")
	case api.IsNotFound(err):
		output.Error("%v", err)
	default:
		output.Error("%v", err)
	}
}
