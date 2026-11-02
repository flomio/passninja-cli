package api

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
)

type stubTokens struct {
	current   string
	refreshes int
	rejected  string
}

func (s *stubTokens) Token(context.Context) (string, error) { return s.current, nil }

func (s *stubTokens) Refresh(_ context.Context, rejected string) (string, error) {
	s.refreshes++
	s.rejected = rejected
	s.current = "fresh"
	return s.current, nil
}

func TestSessionClientRefreshesOnceOn401(t *testing.T) {
	var seen []string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		seen = append(seen, r.Header.Get("Authorization"))
		if r.Header.Get("X-API-KEY") != "" {
			t.Error("session requests must not send the API key header")
		}
		if r.Header.Get("Authorization") != "Bearer fresh" {
			w.WriteHeader(http.StatusUnauthorized)
			_, _ = w.Write([]byte(`{"error":"invalid_token"}`))
			return
		}
		_, _ = w.Write([]byte(`{"ok":true}`))
	}))
	defer srv.Close()

	ts := &stubTokens{current: "revoked-elsewhere"}
	c := NewClient("", "aid_0x2a", WithBaseURL(srv.URL), WithTokenSource(ts))
	var out map[string]bool
	if err := c.do(context.Background(), http.MethodGet, "/x", nil, &out); err != nil {
		t.Fatalf("do: %v", err)
	}
	if !out["ok"] || ts.refreshes != 1 || ts.rejected != "revoked-elsewhere" {
		t.Fatalf("out=%v refreshes=%d rejected=%q", out, ts.refreshes, ts.rejected)
	}
	if len(seen) != 2 {
		t.Fatalf("expected one retry, saw %d requests", len(seen))
	}
}

func TestSessionClientGivesUpAfterOneRefresh(t *testing.T) {
	calls := 0
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		calls++
		w.WriteHeader(http.StatusUnauthorized)
		_, _ = w.Write([]byte(`{"error":"invalid_token"}`))
	}))
	defer srv.Close()

	ts := &stubTokens{current: "a"}
	c := NewClient("", "", WithBaseURL(srv.URL), WithTokenSource(ts))
	err := c.do(context.Background(), http.MethodGet, "/x", nil, nil)
	if !IsAuth(err) || ts.refreshes != 1 || calls != 2 {
		t.Fatalf("err=%v refreshes=%d calls=%d", err, ts.refreshes, calls)
	}
}
