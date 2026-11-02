package oauth

import (
	"context"
	"errors"
	"fmt"
	"html"
	"net"
	"net/http"
	"net/url"
	"os/exec"
	"runtime"
	"strings"
	"time"

	"github.com/flomio/passninja-cli/pkg/session"
)

// loginTimeout bounds how long `login` waits for the browser to come back.
const loginTimeout = 5 * time.Minute

// BrowserLogin runs the authorization-code + PKCE flow over a loopback
// redirect (RFC 8252 §7.3): listen on an ephemeral 127.0.0.1 port, send the
// user's browser to /oauth/authorize, and exchange the code it brings back.
// If the browser already holds a PassNinja session, no password is asked.
//
// announce is called with the authorize URL before the browser is opened,
// so the caller can print it as a fallback for when no browser launches.
func (c Config) BrowserLogin(ctx context.Context, openBrowser bool, announce func(authorizeURL string)) (*session.Session, error) {
	verifier, challenge, err := pkcePair()
	if err != nil {
		return nil, err
	}
	state, err := randomString(16)
	if err != nil {
		return nil, err
	}

	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		return nil, fmt.Errorf("open local callback listener: %w", err)
	}
	defer ln.Close()
	redirectURI := fmt.Sprintf("http://127.0.0.1:%d/callback", ln.Addr().(*net.TCPAddr).Port)

	q := url.Values{
		"response_type":         {"code"},
		"client_id":             {ClientID},
		"redirect_uri":          {redirectURI},
		"scope":                 {strings.Join(Scopes, " ")},
		"state":                 {state},
		"code_challenge":        {challenge},
		"code_challenge_method": {"S256"},
	}
	authorizeURL := c.endpoint("/oauth/authorize") + "?" + q.Encode()

	type result struct {
		code string
		err  error
	}
	results := make(chan result, 1)
	mux := http.NewServeMux()
	mux.HandleFunc("/callback", func(w http.ResponseWriter, r *http.Request) {
		params := r.URL.Query()
		var res result
		switch {
		case params.Get("state") != state:
			// Not our flow (stale tab, or a forged redirect) — ignore it
			// rather than ending the login.
			writeCallbackPage(w, http.StatusBadRequest, "Login link expired",
				"This page doesn't match the login in progress. Run <code>passninja login</code> again.")
			return
		case params.Get("error") != "":
			res.err = &OAuthError{Code: params.Get("error"), Description: params.Get("error_description")}
			writeCallbackPage(w, http.StatusOK, "Login cancelled",
				"The PassNinja CLI was not signed in. You can close this tab.")
		case params.Get("code") == "":
			res.err = errors.New("authorization server returned no code")
			writeCallbackPage(w, http.StatusBadRequest, "Login failed",
				"No authorization code was returned. Run <code>passninja login</code> again.")
		default:
			res.code = params.Get("code")
			writeCallbackPage(w, http.StatusOK, "You're logged in",
				"The PassNinja CLI is signed in. You can close this tab and return to your terminal.")
		}
		select {
		case results <- res:
		default:
		}
	})
	srv := &http.Server{Handler: mux, ReadHeaderTimeout: 10 * time.Second}
	go func() { _ = srv.Serve(ln) }()
	defer func() {
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer cancel()
		_ = srv.Shutdown(shutdownCtx)
	}()

	if announce != nil {
		announce(authorizeURL)
	}
	if openBrowser {
		// A browser that fails to launch isn't fatal — the URL was announced.
		_ = OpenBrowser(authorizeURL)
	}

	ctx, cancel := context.WithTimeout(ctx, loginTimeout)
	defer cancel()
	var res result
	select {
	case res = <-results:
	case <-ctx.Done():
		return nil, fmt.Errorf("gave up waiting for the browser login: %w", ctx.Err())
	}
	if res.err != nil {
		return nil, res.err
	}

	return c.exchange(ctx, url.Values{
		"grant_type":    {"authorization_code"},
		"code":          {res.code},
		"redirect_uri":  {redirectURI},
		"code_verifier": {verifier},
	})
}

func writeCallbackPage(w http.ResponseWriter, status int, title, bodyHTML string) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(status)
	fmt.Fprintf(w, `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>%s · PassNinja</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#f9fafb;color:#111827;
display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:16px}
main{background:#fff;border-radius:12px;box-shadow:0 10px 25px rgba(0,0,0,.08);padding:32px;max-width:420px;text-align:center}
h1{font-size:22px;margin:0 0 8px}p{color:#374151;line-height:1.5;margin:0}code{background:#f3f4f6;padding:1px 5px;border-radius:4px}</style>
</head><body><main><h1>%s</h1><p>%s</p></main></body></html>`, html.EscapeString(title), html.EscapeString(title), bodyHTML)
}

// OpenBrowser launches the platform's default browser at u.
func OpenBrowser(u string) error {
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "darwin":
		cmd = exec.Command("open", u)
	case "windows":
		cmd = exec.Command("rundll32", "url.dll,FileProtocolHandler", u)
	default:
		cmd = exec.Command("xdg-open", u)
	}
	return cmd.Start()
}
