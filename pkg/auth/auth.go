// Package auth handles the persistent ~/.passninja-auth.json credential
// file: read, atomic write, and a small interactive prompt flow.
package auth

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"time"
)

const fileName = ".passninja-auth.json"

// Credentials is everything `passninja auth` persists to disk.
type Credentials struct {
	APIKey    string `json:"api_key"`
	AccountID string `json:"account_id"`
	BaseURL   string `json:"base_url,omitempty"`
	SavedAt   string `json:"saved_at,omitempty"`
}

// Path returns the canonical credentials file path (~/.passninja-auth.json).
func Path() (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", fmt.Errorf("locate home directory: %w", err)
	}
	return filepath.Join(home, fileName), nil
}

// Load reads the credentials file. Returns (nil, nil) when no file exists
// so the caller can fall back to flags / env without distinguishing error
// classes — distinguish only with errors.Is(err, os.ErrNotExist) if needed.
func Load() (*Credentials, error) {
	path, err := Path()
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
	var c Credentials
	if err := json.Unmarshal(b, &c); err != nil {
		return nil, fmt.Errorf("parse %s: %w", path, err)
	}
	return &c, nil
}

// Save writes the credentials atomically with 0600 permissions. Uses
// rename-over-existing so a crash mid-write doesn't leave a half-written file.
func Save(c Credentials) error {
	path, err := Path()
	if err != nil {
		return err
	}
	c.SavedAt = time.Now().UTC().Format(time.RFC3339)

	b, err := json.MarshalIndent(c, "", "  ")
	if err != nil {
		return fmt.Errorf("marshal credentials: %w", err)
	}

	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0o700); err != nil {
		return fmt.Errorf("ensure %s: %w", dir, err)
	}

	tmp, err := os.CreateTemp(dir, ".passninja-auth.*.tmp")
	if err != nil {
		return fmt.Errorf("open temp: %w", err)
	}
	tmpPath := tmp.Name()
	if _, err := tmp.Write(b); err != nil {
		_ = tmp.Close()
		_ = os.Remove(tmpPath)
		return fmt.Errorf("write temp: %w", err)
	}
	if err := tmp.Chmod(0o600); err != nil {
		_ = tmp.Close()
		_ = os.Remove(tmpPath)
		return fmt.Errorf("chmod temp: %w", err)
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
