package mcp

import (
	"context"
	"net/http"
	"strings"

	"github.com/flomio/passninja-cli/pkg/api"
	mcplib "github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"
)

// needAuthResult is returned when a tool is invoked without resolvable
// PassNinja credentials — i.e. HTTP mode with missing or empty
// X-Api-Key / X-Account-Id headers, or stdio mode with no default client
// (which should never happen since cmd/mcp.go errors out at startup).
func needAuthResult() *mcplib.CallToolResult {
	return mcplib.NewToolResultError(
		"missing PassNinja credentials: HTTP requests must include both X-Api-Key " +
			"and X-Account-Id headers; stdio sessions must set PASSNINJA_API_KEY and " +
			"PASSNINJA_ACCOUNT_ID env vars or have run `passninja auth`")
}

// ctxClientKey is the unexported context key used to thread a per-request
// *api.Client from the HTTP transport layer down to individual tool
// handlers. Each MCP-over-HTTP request carries its own credentials in
// headers; httpContextFunc materializes them into a Client and stashes it
// here. Stdio mode never sets this key, so tool handlers fall back to the
// closure-captured default client.
type ctxClientKey struct{}

// clientFromCtx returns the per-request *api.Client from ctx, or fallback
// when none was attached (i.e. stdio mode, or HTTP mode with missing
// credential headers).
func clientFromCtx(ctx context.Context, fallback *api.Client) *api.Client {
	if c, ok := ctx.Value(ctxClientKey{}).(*api.Client); ok && c != nil {
		return c
	}
	return fallback
}

// httpContextFunc builds an HTTPContextFunc that extracts PassNinja
// credentials from incoming request headers and attaches a freshly
// constructed *api.Client to ctx. Each request is single-tenant; the
// server itself holds no global credentials when running in HTTP mode.
//
// Two authentication modes are recognized, in priority order:
//
//  1. OAuth bearer — `Authorization: Bearer <token>`. The token is NOT
//     validated here; the client forwards it straight to /v1, whose
//     oauthBearerAuth middleware validates it and resolves the account.
//     This is the path ChatGPT Apps SDK (and any OAuth client) uses.
//  2. Header-pair — `X-Api-Key` + `X-Account-Id`. The direct path for
//     scripts and trusted callers holding raw account credentials.
//
// Header (case-insensitive; Go's http.Header normalizes):
//
//	Authorization     — "Bearer <oauth_access_token>"  (mode 1)
//	X-Api-Key         — the PassNinja API token         (mode 2)
//	X-Account-Id      — the aid_0x... account id        (mode 2)
//	X-Passninja-Base  — optional API base URL override (for staging)
//
// Requests with neither mode are passed through with no client attached;
// tool handlers detect that and return a clear MCP error rather than the
// HTTP layer rejecting with a bare 401, keeping protocol-level error
// semantics consistent across transports.
func httpContextFunc(defaultBaseURL, userAgent string) server.HTTPContextFunc {
	return func(ctx context.Context, r *http.Request) context.Context {
		baseURL := r.Header.Get("X-Passninja-Base")
		if baseURL == "" {
			baseURL = defaultBaseURL
		}

		// Mode 1: OAuth bearer passthrough.
		if authz := r.Header.Get("Authorization"); strings.HasPrefix(authz, "Bearer ") {
			token := strings.TrimSpace(strings.TrimPrefix(authz, "Bearer "))
			if token != "" {
				c := api.NewClient("", "",
					api.WithBearerToken(token),
					api.WithBaseURL(baseURL),
					api.WithUserAgent(userAgent),
				)
				return context.WithValue(ctx, ctxClientKey{}, c)
			}
		}

		// Mode 2: header-pair.
		apiKey := r.Header.Get("X-Api-Key")
		accountID := r.Header.Get("X-Account-Id")
		if apiKey == "" || accountID == "" {
			return ctx
		}
		c := api.NewClient(
			apiKey,
			accountID,
			api.WithBaseURL(baseURL),
			api.WithUserAgent(userAgent),
		)
		return context.WithValue(ctx, ctxClientKey{}, c)
	}
}
