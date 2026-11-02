package oauth

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/flomio/passninja-cli/pkg/session"
	"github.com/zalando/go-keyring"
)

// fakeAuthServer is a minimal stand-in for the PassNinja authorization
// server: authorize (auto-approves), token (code, refresh with rotation and
// reuse detection, device code), device_authorization, and revoke.
type fakeAuthServer struct {
	*httptest.Server
	mu            sync.Mutex
	codes         map[string]string // code → redirect_uri
	liveRefresh   map[string]bool   // refresh token → still valid
	refreshCalls  atomic.Int32
	devicePolls   atomic.Int32
	deviceApprove int32 // polls answered "pending" before approval
	revoked       []string
	nextID        int
}

func newFakeAuthServer(t *testing.T) *fakeAuthServer {
	f := &fakeAuthServer{codes: map[string]string{}, liveRefresh: map[string]bool{}}
	mux := http.NewServeMux()
	mux.HandleFunc("/oauth/authorize", func(w http.ResponseWriter, r *http.Request) {
		q := r.URL.Query()
		if q.Get("client_id") != ClientID || q.Get("code_challenge_method") != "S256" || q.Get("code_challenge") == "" {
			http.Error(w, "bad authorize request", http.StatusBadRequest)
			return
		}
		f.mu.Lock()
		f.nextID++
		code := fmt.Sprintf("code-%d", f.nextID)
		f.codes[code] = q.Get("redirect_uri")
		f.mu.Unlock()
		cb, _ := url.Parse(q.Get("redirect_uri"))
		v := cb.Query()
		v.Set("code", code)
		v.Set("state", q.Get("state"))
		cb.RawQuery = v.Encode()
		http.Redirect(w, r, cb.String(), http.StatusFound)
	})
	mux.HandleFunc("/oauth/token", func(w http.ResponseWriter, r *http.Request) {
		_ = r.ParseForm()
		switch r.Form.Get("grant_type") {
		case "authorization_code":
			f.mu.Lock()
			uri, ok := f.codes[r.Form.Get("code")]
			delete(f.codes, r.Form.Get("code"))
			f.mu.Unlock()
			if !ok || uri != r.Form.Get("redirect_uri") || r.Form.Get("code_verifier") == "" {
				writeJSON(w, 400, map[string]string{"error": "invalid_grant"})
				return
			}
			writeJSON(w, 200, f.mint(3600))
		case "refresh_token":
			f.refreshCalls.Add(1)
			// Slow enough that unlocked concurrent refreshes would overlap.
			time.Sleep(50 * time.Millisecond)
			f.mu.Lock()
			live := f.liveRefresh[r.Form.Get("refresh_token")]
			if !live {
				// Reuse of a rotated token: the real server revokes the chain.
				for k := range f.liveRefresh {
					f.liveRefresh[k] = false
				}
				f.mu.Unlock()
				writeJSON(w, 400, map[string]string{"error": "invalid_grant", "error_description": "refresh token reuse detected"})
				return
			}
			f.liveRefresh[r.Form.Get("refresh_token")] = false
			f.mu.Unlock()
			writeJSON(w, 200, f.mint(3600))
		case "urn:ietf:params:oauth:grant-type:device_code":
			if f.devicePolls.Add(1) <= f.deviceApprove {
				writeJSON(w, 400, map[string]string{"error": "authorization_pending"})
				return
			}
			writeJSON(w, 200, f.mint(3600))
		default:
			writeJSON(w, 400, map[string]string{"error": "unsupported_grant_type"})
		}
	})
	mux.HandleFunc("/oauth/device_authorization", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, 200, map[string]any{
			"device_code": "dev-code", "user_code": "WDJB-MJHT",
			"verification_uri": "https://example.test/oauth/device", "verification_uri_complete": "https://example.test/oauth/device?user_code=WDJB-MJHT",
			"expires_in": 30, "interval": 0,
		})
	})
	mux.HandleFunc("/oauth/revoke", func(w http.ResponseWriter, r *http.Request) {
		_ = r.ParseForm()
		f.mu.Lock()
		f.revoked = append(f.revoked, r.Form.Get("token"))
		f.liveRefresh[r.Form.Get("token")] = false
		f.mu.Unlock()
		writeJSON(w, 200, map[string]string{})
	})
	f.Server = httptest.NewServer(mux)
	t.Cleanup(f.Close)
	return f
}

func (f *fakeAuthServer) mint(expiresIn int) map[string]any {
	f.mu.Lock()
	defer f.mu.Unlock()
	f.nextID++
	rt := fmt.Sprintf("rt-%d", f.nextID)
	f.liveRefresh[rt] = true
	return map[string]any{
		"access_token": fmt.Sprintf("at-%d", f.nextID), "token_type": "Bearer",
		"expires_in": expiresIn, "refresh_token": rt, "refresh_token_expires_in": 30 * 86400,
		"scope": "passes:read", "account_id": "aid_0x2a",
	}
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

// isolate points the session store at a temp HOME and an in-memory keychain.
func isolate(t *testing.T) {
	t.Setenv("HOME", t.TempDir())
	keyring.MockInit()
}

// isolateFileStore is isolate with no keychain, so sessions use the 0600
// file. The concurrency test needs it: go-keyring's in-memory mock isn't
// goroutine-safe, and the race detector can't see that the file lock
// already serializes access (real processes don't share memory anyway).
func isolateFileStore(t *testing.T) {
	t.Setenv("HOME", t.TempDir())
	keyring.MockInitWithError(errors.New("no keychain on this host"))
}

func TestBrowserLoginLoopbackPKCE(t *testing.T) {
	isolate(t)
	srv := newFakeAuthServer(t)
	cfg := Config{AuthURL: srv.URL, BaseURL: "https://api.example.test/v1"}

	// Play the browser: follow the authorize URL, which redirects to the
	// CLI's loopback listener.
	s, err := cfg.BrowserLogin(context.Background(), false, func(u string) {
		go func() {
			resp, err := http.Get(u)
			if err == nil {
				resp.Body.Close()
			}
		}()
	})
	if err != nil {
		t.Fatalf("BrowserLogin: %v", err)
	}
	if s.AccountID != "aid_0x2a" || s.AuthURL != srv.URL || s.BaseURL != "https://api.example.test/v1" {
		t.Fatalf("unexpected session: %+v", s)
	}
	if !s.Valid(time.Minute) || s.SessionExpiresAt.Before(time.Now().Add(29*24*time.Hour)) {
		t.Fatalf("expiries not set: %+v", s)
	}
}

func TestBrowserLoginIgnoresForeignState(t *testing.T) {
	isolate(t)
	srv := newFakeAuthServer(t)
	cfg := Config{AuthURL: srv.URL}
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	_, err := cfg.BrowserLogin(ctx, false, func(u string) {
		go func() {
			au, _ := url.Parse(u)
			cb, _ := url.Parse(au.Query().Get("redirect_uri"))
			cb.RawQuery = url.Values{"code": {"stolen"}, "state": {"forged"}}.Encode()
			resp, err := http.Get(cb.String())
			if err == nil {
				resp.Body.Close()
			}
		}()
	})
	if !errors.Is(err, context.DeadlineExceeded) {
		t.Fatalf("a forged state must not complete the login; got %v", err)
	}
}

func TestFileFallbackIsPrivate(t *testing.T) {
	isolateFileStore(t)
	where, err := session.Save(&session.Session{AccessToken: "a", RefreshToken: "r"})
	if err != nil {
		t.Fatal(err)
	}
	info, err := os.Stat(where)
	if err != nil {
		t.Fatalf("expected the file store at %q: %v", where, err)
	}
	if info.Mode().Perm() != 0o600 {
		t.Fatalf("session file mode = %v, want 0600", info.Mode().Perm())
	}
	if err := session.Delete(); err != nil {
		t.Fatal(err)
	}
	if left, _ := session.Load(); left != nil {
		t.Fatal("Delete left the session behind")
	}
}

func TestDeviceLoginPollsUntilApproved(t *testing.T) {
	isolate(t)
	srv := newFakeAuthServer(t)
	srv.deviceApprove = 2
	defer func(d time.Duration) { defaultPollInterval = d }(defaultPollInterval)
	defaultPollInterval = 10 * time.Millisecond
	var shown string
	s, err := Config{AuthURL: srv.URL}.DeviceLogin(context.Background(), func(dc *DeviceCode) { shown = dc.UserCode })
	if err != nil {
		t.Fatalf("DeviceLogin: %v", err)
	}
	if shown != "WDJB-MJHT" || srv.devicePolls.Load() != 3 || s.AccessToken == "" {
		t.Fatalf("shown=%q polls=%d session=%+v", shown, srv.devicePolls.Load(), s)
	}
}

// Two processes refreshing the same expired session at once must produce
// exactly one rotation — a second would replay a rotated refresh token and
// the server would revoke the whole session.
func TestConcurrentRefreshRotatesOnce(t *testing.T) {
	isolateFileStore(t)
	srv := newFakeAuthServer(t)
	cfg := Config{AuthURL: srv.URL}
	initial := cfg.sessionFrom(tokenResponse{})
	minted := srv.mint(0) // already expired access token
	initial.AccessToken = minted["access_token"].(string)
	initial.RefreshToken = minted["refresh_token"].(string)
	initial.ExpiresAt = time.Now().Add(-time.Minute)
	if _, err := session.Save(initial); err != nil {
		t.Fatal(err)
	}

	// Separate TokenSources model separate processes: no shared memory,
	// only the store and the lock file.
	var wg sync.WaitGroup
	tokens := make([]string, 4)
	errs := make([]error, 4)
	for i := range tokens {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			stale := *initial
			tokens[i], errs[i] = NewTokenSource(&stale, Config{}).Token(context.Background())
		}(i)
	}
	wg.Wait()
	for i, err := range errs {
		if err != nil {
			t.Fatalf("source %d: %v", i, err)
		}
		if tokens[i] != tokens[0] {
			t.Fatalf("sources disagree: %v", tokens)
		}
	}
	if n := srv.refreshCalls.Load(); n != 1 {
		t.Fatalf("expected exactly one refresh, got %d", n)
	}
}

func TestRefreshAfterRevokeIsSessionExpired(t *testing.T) {
	isolate(t)
	srv := newFakeAuthServer(t)
	cfg := Config{AuthURL: srv.URL}
	s := cfg.sessionFrom(tokenResponse{})
	minted := srv.mint(0)
	s.AccessToken, s.RefreshToken = minted["access_token"].(string), minted["refresh_token"].(string)
	s.ExpiresAt = time.Now().Add(-time.Minute)
	if err := cfg.Revoke(context.Background(), s); err != nil {
		t.Fatal(err)
	}
	if _, err := session.Save(s); err != nil {
		t.Fatal(err)
	}

	_, err := NewTokenSource(s, Config{}).Token(context.Background())
	if !errors.Is(err, ErrSessionExpired) {
		t.Fatalf("want ErrSessionExpired, got %v", err)
	}
	if left, _ := session.Load(); left != nil {
		t.Fatal("a dead session must be removed from the store")
	}
}

func TestReloginReplacesDeadSession(t *testing.T) {
	isolate(t)
	srv := newFakeAuthServer(t)
	cfg := Config{AuthURL: srv.URL}
	dead := cfg.sessionFrom(tokenResponse{AccessToken: "old", RefreshToken: "never-issued"})
	dead.ExpiresAt = time.Now().Add(-time.Minute)

	ts := NewTokenSource(dead, Config{})
	ts.Relogin = func(ctx context.Context) (*session.Session, error) {
		fresh := cfg.sessionFrom(tokenResponse{AccessToken: "fresh", RefreshToken: "r", ExpiresIn: 3600})
		return fresh, nil
	}
	tok, err := ts.Token(context.Background())
	if err != nil || tok != "fresh" {
		t.Fatalf("tok=%q err=%v", tok, err)
	}
	if stored, _ := session.Load(); stored == nil || stored.AccessToken != "fresh" {
		t.Fatalf("relogin result not persisted: %+v", stored)
	}
}

func TestAuthURLFor(t *testing.T) {
	cases := map[string]string{
		"":                             DefaultAuthURL,
		"https://api.passninja.com/v1": DefaultAuthURL,
		"http://localhost:3000/v1":     "http://localhost:3000",
		"https://qa.passninja.com/v1":  "https://qa.passninja.com",
	}
	for in, want := range cases {
		if got := AuthURLFor(in); got != want {
			t.Errorf("AuthURLFor(%q) = %q, want %q", in, got, want)
		}
	}
}
