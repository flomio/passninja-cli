// Package oauth implements the CLI side of PassNinja's OAuth 2.1
// authorization server: browser login over a loopback redirect with PKCE
// (RFC 8252), device-code login for hosts without a browser (RFC 8628),
// refresh-token rotation, and revocation (RFC 7009).
package oauth

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/flomio/passninja-cli/pkg/session"
)

const (
	// ClientID is the CLI's registration on the authorization server: a
	// public (secretless) first-party client with a 30-day session cap.
	ClientID       = "passninja-cli"
	DefaultAuthURL = "https://auth.passninja.com"
)

// Scopes requests every scope a CLI command can need.
var Scopes = []string{
	"account:read",
	"pass_templates:read", "pass_templates:write", "pass_templates:delete",
	"passes:read", "passes:write", "passes:delete",
	"webhooks:read", "webhooks:write", "webhooks:delete",
	"readers:read", "readers:write",
	"scans:read",
}

// ErrSessionExpired means the refresh token is no longer accepted (session
// cap reached, revoked, or rotated away) and the user must log in again.
var ErrSessionExpired = errors.New("login session expired")

// Config is where to log in and which API the session is for.
type Config struct {
	AuthURL    string
	BaseURL    string
	HTTPClient *http.Client
}

func (c Config) httpClient() *http.Client {
	if c.HTTPClient != nil {
		return c.HTTPClient
	}
	return &http.Client{Timeout: 30 * time.Second}
}

func (c Config) endpoint(path string) string {
	return strings.TrimRight(c.AuthURL, "/") + path
}

// AuthURLFor derives the authorization server from an API base URL:
// production's api.passninja.com logs in at auth.passninja.com; any other
// API (local dev, QA) serves its OAuth routes on its own origin.
func AuthURLFor(baseURL string) string {
	if baseURL == "" {
		return DefaultAuthURL
	}
	u, err := url.Parse(baseURL)
	if err != nil || u.Host == "" {
		return DefaultAuthURL
	}
	if u.Hostname() == "api.passninja.com" {
		return DefaultAuthURL
	}
	return u.Scheme + "://" + u.Host
}

// tokenResponse is the token endpoint's success or error body.
type tokenResponse struct {
	AccessToken           string `json:"access_token"`
	RefreshToken          string `json:"refresh_token"`
	ExpiresIn             int64  `json:"expires_in"`
	RefreshTokenExpiresIn int64  `json:"refresh_token_expires_in"`
	Scope                 string `json:"scope"`
	AccountID             string `json:"account_id"`
	Error                 string `json:"error"`
	ErrorDescription      string `json:"error_description"`
	Interval              int    `json:"interval"`
}

// OAuthError is an RFC 6749 §5.2 error from the authorization server.
type OAuthError struct {
	Code        string
	Description string
}

func (e *OAuthError) Error() string {
	if e.Description != "" {
		return fmt.Sprintf("%s: %s", e.Code, e.Description)
	}
	return e.Code
}

func (c Config) postForm(ctx context.Context, path string, form url.Values, out any) (int, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.endpoint(path), strings.NewReader(form.Encode()))
	if err != nil {
		return 0, fmt.Errorf("build request: %w", err)
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Accept", "application/json")
	resp, err := c.httpClient().Do(req)
	if err != nil {
		return 0, fmt.Errorf("reach %s: %w", c.AuthURL, err)
	}
	defer resp.Body.Close()
	if out != nil {
		if err := json.NewDecoder(resp.Body).Decode(out); err != nil {
			return resp.StatusCode, fmt.Errorf("decode %s response (HTTP %d): %w", path, resp.StatusCode, err)
		}
	}
	return resp.StatusCode, nil
}

// exchange POSTs a token request and turns a success into a Session.
func (c Config) exchange(ctx context.Context, form url.Values) (*session.Session, error) {
	form.Set("client_id", ClientID)
	var tr tokenResponse
	if _, err := c.postForm(ctx, "/oauth/token", form, &tr); err != nil {
		return nil, err
	}
	if tr.Error != "" {
		return nil, &OAuthError{Code: tr.Error, Description: tr.ErrorDescription}
	}
	if tr.AccessToken == "" {
		return nil, errors.New("token response carried no access_token")
	}
	return c.sessionFrom(tr), nil
}

func (c Config) sessionFrom(tr tokenResponse) *session.Session {
	now := time.Now()
	s := &session.Session{
		AccessToken:  tr.AccessToken,
		RefreshToken: tr.RefreshToken,
		ExpiresAt:    now.Add(time.Duration(tr.ExpiresIn) * time.Second),
		AccountID:    tr.AccountID,
		Scope:        tr.Scope,
		AuthURL:      c.AuthURL,
		BaseURL:      c.BaseURL,
	}
	if tr.RefreshTokenExpiresIn > 0 {
		s.SessionExpiresAt = now.Add(time.Duration(tr.RefreshTokenExpiresIn) * time.Second)
	}
	return s
}

// Refresh rotates the session's refresh token for a new token pair. The
// old pair is dead afterwards — callers must persist the result before
// any other process can use it (see TokenSource for the locking).
func (c Config) Refresh(ctx context.Context, s *session.Session) (*session.Session, error) {
	if s.RefreshToken == "" {
		return nil, ErrSessionExpired
	}
	next, err := c.exchange(ctx, url.Values{
		"grant_type":    {"refresh_token"},
		"refresh_token": {s.RefreshToken},
	})
	var oe *OAuthError
	if errors.As(err, &oe) && oe.Code == "invalid_grant" {
		return nil, fmt.Errorf("%w (%s)", ErrSessionExpired, oe.Description)
	}
	if err != nil {
		return nil, err
	}
	if next.AccountID == "" {
		next.AccountID = s.AccountID
	}
	return next, nil
}

// Revoke ends the session server-side. Revoking the refresh token kills
// its whole rotation chain, access token included.
func (c Config) Revoke(ctx context.Context, s *session.Session) error {
	token, hint := s.RefreshToken, "refresh_token"
	if token == "" {
		token, hint = s.AccessToken, "access_token"
	}
	status, err := c.postForm(ctx, "/oauth/revoke", url.Values{
		"client_id":       {ClientID},
		"token":           {token},
		"token_type_hint": {hint},
	}, nil)
	if err != nil {
		return err
	}
	if status != http.StatusOK {
		return fmt.Errorf("revoke failed: HTTP %d", status)
	}
	return nil
}

// pkcePair returns a fresh RFC 7636 code verifier and its S256 challenge.
func pkcePair() (verifier, challenge string, err error) {
	verifier, err = randomString(32)
	if err != nil {
		return "", "", err
	}
	sum := sha256.Sum256([]byte(verifier))
	return verifier, base64.RawURLEncoding.EncodeToString(sum[:]), nil
}

func randomString(n int) (string, error) {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		return "", fmt.Errorf("read random bytes: %w", err)
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}
