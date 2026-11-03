package oauth

import (
	"context"
	"errors"
	"fmt"
	"path/filepath"
	"sync"
	"time"

	"github.com/flomio/passninja-cli/pkg/session"
	"github.com/gofrs/flock"
)

// refreshMargin refreshes a little before expiry so a token can't lapse
// between the check and the request.
const refreshMargin = 60 * time.Second

// TokenSource hands out a valid access token for the stored session,
// refreshing it when needed. It satisfies api.TokenSource.
//
// Refresh-token rotation makes concurrent refreshes dangerous: rotating
// revokes the old pair, and the server treats a second use of the old
// refresh token as theft and revokes the whole session. Two CLI processes
// (say a script and `passninja mcp`) refreshing at once would log the user
// out. So every refresh holds an exclusive file lock across processes and
// re-reads the store first — if another process already rotated, its
// fresh token is used instead of refreshing again.
type TokenSource struct {
	cfg     Config
	mu      sync.Mutex
	current *session.Session
	// Relogin, when set, is called once the session can no longer be
	// refreshed (cap reached or revoked). Interactive commands set it to
	// rerun the browser login; non-interactive ones leave it nil and fail.
	Relogin func(ctx context.Context) (*session.Session, error)
}

// NewTokenSource wraps a loaded session. Refreshes go to the authorization
// server that minted it; cfg supplies only the HTTP client.
func NewTokenSource(s *session.Session, cfg Config) *TokenSource {
	cfg.AuthURL = s.AuthURL
	if cfg.AuthURL == "" {
		cfg.AuthURL = DefaultAuthURL
	}
	cfg.BaseURL = s.BaseURL
	return &TokenSource{cfg: cfg, current: s}
}

// Session returns the session as last seen by this process.
func (t *TokenSource) Session() *session.Session {
	t.mu.Lock()
	defer t.mu.Unlock()
	return t.current
}

// Token returns an access token valid for at least refreshMargin.
func (t *TokenSource) Token(ctx context.Context) (string, error) {
	t.mu.Lock()
	defer t.mu.Unlock()
	if t.current.Valid(refreshMargin) {
		return t.current.AccessToken, nil
	}
	return t.refreshLocked(ctx, "")
}

// Refresh replaces a token the API rejected (401) — e.g. revoked by a
// concurrent rotation in another process — and returns its successor.
func (t *TokenSource) Refresh(ctx context.Context, rejected string) (string, error) {
	t.mu.Lock()
	defer t.mu.Unlock()
	return t.refreshLocked(ctx, rejected)
}

func (t *TokenSource) refreshLocked(ctx context.Context, rejected string) (string, error) {
	dir, err := session.Dir()
	if err != nil {
		return "", err
	}
	lock := flock.New(filepath.Join(dir, "session.lock"))
	locked, err := lock.TryLockContext(ctx, 100*time.Millisecond)
	if err != nil {
		return "", fmt.Errorf("lock session for refresh: %w", err)
	}
	if !locked {
		return "", errors.New("could not lock the session for refresh")
	}
	defer func() { _ = lock.Unlock() }()

	// Another process may have rotated while we waited for the lock.
	stored, err := session.Load()
	if err != nil {
		return "", err
	}
	if stored != nil && stored.AccessToken != rejected && stored.Valid(refreshMargin) {
		t.current = stored
		return stored.AccessToken, nil
	}
	base := t.current
	if stored != nil {
		base = stored
	}

	next, err := t.cfg.Refresh(ctx, base)
	if errors.Is(err, ErrSessionExpired) {
		_ = session.Delete()
		if t.Relogin == nil {
			return "", err
		}
		next, err = t.Relogin(ctx)
	}
	if err != nil {
		return "", err
	}
	if _, err := session.Save(next); err != nil {
		return "", fmt.Errorf("save refreshed session: %w", err)
	}
	t.current = next
	return next.AccessToken, nil
}
