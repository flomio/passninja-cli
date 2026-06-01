package mcp

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
)

// ProtectedResourcePath is the RFC 9728 well-known location where this MCP
// server advertises which authorization server protects it.
const ProtectedResourcePath = "/.well-known/oauth-protected-resource"

// DefaultAuthServerURL is the PassNinja OAuth authorization server that
// issues and validates tokens for this resource. Overridable via
// HTTPOptions.AuthServerURL / the --auth-server-url flag.
const DefaultAuthServerURL = "https://auth.passninja.com"

// mcpScopes mirrors the PassNinja OAuth scope catalog advertised by the
// authorization server. Kept in sync with src/services/oauth/scopes.ts.
var mcpScopes = []string{
	"account:read",
	"pass_templates:read", "pass_templates:write", "pass_templates:delete",
	"passes:read", "passes:write", "passes:delete",
	"webhooks:read", "webhooks:write", "webhooks:delete",
}

// publicBaseURL reconstructs this server's externally-visible origin from
// the request, honoring the reverse-proxy X-Forwarded-Proto header (Heroku
// terminates TLS upstream so r.TLS is nil). An explicit override wins.
func publicBaseURL(r *http.Request, override string) string {
	if override != "" {
		return strings.TrimRight(override, "/")
	}
	scheme := r.Header.Get("X-Forwarded-Proto")
	if scheme == "" {
		if r.TLS != nil {
			scheme = "https"
		} else {
			scheme = "http"
		}
	}
	return scheme + "://" + r.Host
}

// protectedResourceMetadata serves RFC 9728 Protected Resource Metadata so
// MCP clients (ChatGPT Apps SDK, Claude.ai connectors) can discover the
// authorization server that protects this resource and the scopes it offers.
func protectedResourceMetadata(authServerURL, publicURL string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		doc := map[string]any{
			"resource":                 publicBaseURL(r, publicURL),
			"authorization_servers":    []string{authServerURL},
			"scopes_supported":         mcpScopes,
			"bearer_methods_supported": []string{"header"},
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(doc)
	}
}

// requestHasCredentials reports whether the request carries either auth mode
// the server accepts (OAuth bearer, or the X-Api-Key + X-Account-Id pair).
// Mirrors httpContextFunc's recognition logic exactly.
func requestHasCredentials(r *http.Request) bool {
	if authz := r.Header.Get("Authorization"); strings.HasPrefix(authz, "Bearer ") &&
		strings.TrimSpace(strings.TrimPrefix(authz, "Bearer ")) != "" {
		return true
	}
	return r.Header.Get("X-Api-Key") != "" && r.Header.Get("X-Account-Id") != ""
}

// oauthChallengeGate wraps the MCP handler. Requests lacking any recognizable
// credential get a 401 carrying a WWW-Authenticate header that points at our
// protected-resource metadata — the trigger that makes an OAuth-capable MCP
// client begin the discovery + authorization-code (PKCE) flow. Requests that
// already carry credentials pass straight through (validation still happens
// upstream at /v1). This preserves the X-Api-Key path used by the .mcpb /
// Claude Desktop installs. OPTIONS is never challenged so CORS preflight is
// unaffected.
func oauthChallengeGate(next http.Handler, publicURL string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodOptions || requestHasCredentials(r) {
			next.ServeHTTP(w, r)
			return
		}
		metadataURL := publicBaseURL(r, publicURL) + ProtectedResourcePath
		w.Header().Set("WWW-Authenticate", fmt.Sprintf("Bearer resource_metadata=%q", metadataURL))
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		_ = json.NewEncoder(w).Encode(map[string]string{
			"error":             "unauthorized",
			"error_description": "authentication required; see WWW-Authenticate for OAuth metadata",
		})
	})
}
