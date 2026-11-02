// Package session holds the browser-login session: the OAuth access +
// refresh token pair minted by `passninja login`, stored in the OS keychain
// (macOS Keychain, Windows Credential Manager, Linux Secret Service).
//
// Unlike ~/.passninja-auth.json, nothing here is the account's API key. The
// access token lives one hour, the refresh token is capped server-side at a
// 30-day session, and `passninja logout` revokes both — so a copied session
// is time-limited and killable, where a copied API key is not.
//
// On hosts with no keychain service (headless Linux, containers) the session
// falls back to ~/.passninja/session.json with 0600 permissions.
package session

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/zalando/go-keyring"
)

const (
	keyringService = "passninja-cli"
	keyringUser    = "session"
	dirName        = ".passninja"
	fileName       = "session.json"
)

// Session is one browser-login session.
type Session struct {
	AccessToken  string    `json:"access_token"`
	RefreshToken string    `json:"refresh_token"`
	ExpiresAt    time.Time `json:"expires_at"`
	// SessionExpiresAt is when the refresh token (and so the session) ends;
	// after it, `passninja login` is required again.
	SessionExpiresAt time.Time `json:"session_expires_at"`
	AccountID        string    `json:"account_id"`
	Scope            string    `json:"scope"`
	// AuthURL is the authorization server that minted the session, and
	// BaseURL the API it is for — refreshes and API calls must go back to
	// the same pair even when the command line doesn't repeat them.
	AuthURL string `json:"auth_url"`
	BaseURL string `json:"base_url"`
}

// Valid reports whether the access token is usable for at least `margin`.
func (s *Session) Valid(margin time.Duration) bool {
	return s != nil && s.AccessToken != "" && time.Now().Add(margin).Before(s.ExpiresAt)
}

// Dir is ~/.passninja, created 0700 on demand. It holds the fallback
// session file and the refresh lock.
func Dir() (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", fmt.Errorf("locate home directory: %w", err)
	}
	dir := filepath.Join(home, dirName)
	if err := os.MkdirAll(dir, 0o700); err != nil {
		return "", fmt.Errorf("create %s: %w", dir, err)
	}
	return dir, nil
}

func filePath() (string, error) {
	dir, err := Dir()
	if err != nil {
		return "", err
	}
	return filepath.Join(dir, fileName), nil
}

// Load returns the stored session, or (nil, nil) when there is none.
func Load() (*Session, error) {
	raw, err := keyring.Get(keyringService, keyringUser)
	switch {
	case err == nil:
		return decode([]byte(raw))
	case errors.Is(err, keyring.ErrNotFound):
		// Fall through: a session may have been saved to the file on a host
		// whose keychain was unavailable at the time.
	default:
		// No usable keychain on this host — the file is the only store.
	}
	path, err := filePath()
	if err != nil {
		return nil, err
	}
	b, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		return nil, fmt.Errorf("read %s: %w", path, err)
	}
	return decode(b)
}

func decode(b []byte) (*Session, error) {
	var s Session
	if err := json.Unmarshal(b, &s); err != nil {
		return nil, fmt.Errorf("parse stored session: %w", err)
	}
	return &s, nil
}

// Save stores the session in the keychain, falling back to the 0600 file.
// Returns where it was stored ("keychain" or the file path) so `login` can
// tell the user.
func Save(s *Session) (string, error) {
	b, err := json.Marshal(s)
	if err != nil {
		return "", fmt.Errorf("marshal session: %w", err)
	}
	if err := keyring.Set(keyringService, keyringUser, string(b)); err == nil {
		// Don't leave an older plaintext copy behind once the keychain works.
		if path, perr := filePath(); perr == nil {
			_ = os.Remove(path)
		}
		return "keychain", nil
	}
	path, err := filePath()
	if err != nil {
		return "", err
	}
	if err := writeFileAtomic(path, b); err != nil {
		return "", err
	}
	return path, nil
}

// Delete removes the session from every store. Missing entries are fine.
func Delete() error {
	// Errors mean no entry, or no keychain on this host — nothing to remove.
	_ = keyring.Delete(keyringService, keyringUser)
	path, err := filePath()
	if err != nil {
		return err
	}
	if err := os.Remove(path); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("remove %s: %w", path, err)
	}
	return nil
}

func writeFileAtomic(path string, b []byte) error {
	dir := filepath.Dir(path)
	tmp, err := os.CreateTemp(dir, ".session.*.tmp")
	if err != nil {
		return fmt.Errorf("open temp: %w", err)
	}
	tmpPath := tmp.Name()
	cleanup := func() { _ = tmp.Close(); _ = os.Remove(tmpPath) }
	if err := tmp.Chmod(0o600); err != nil {
		cleanup()
		return fmt.Errorf("chmod temp: %w", err)
	}
	if _, err := tmp.Write(b); err != nil {
		cleanup()
		return fmt.Errorf("write temp: %w", err)
	}
	if err := tmp.Close(); err != nil {
		_ = os.Remove(tmpPath)
		return fmt.Errorf("close temp: %w", err)
	}
	if err := os.Rename(tmpPath, path); err != nil {
		_ = os.Remove(tmpPath)
		return fmt.Errorf("rename temp into %s: %w", path, err)
	}
	return nil
}
