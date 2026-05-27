package mcp

import (
	"context"
	"net/http"

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
// Recognized headers (case-insensitive, Go's http.Header normalizes):
//
//	X-Api-Key        — the PassNinja API token
//	X-Account-Id     — the aid_0x... account identifier
//	X-Passninja-Base — optional override of the API base URL (for staging)
//
// Requests missing either of the first two are passed through with no
// client attached. Tool handlers detect this and return a clear MCP error
// rather than the HTTP layer rejecting with a bare 401, which keeps the
// protocol-level error semantics consistent across both transports.
func httpContextFunc(defaultBaseURL, userAgent string) server.HTTPContextFunc {
	return func(ctx context.Context, r *http.Request) context.Context {
		apiKey := r.Header.Get("X-Api-Key")
		accountID := r.Header.Get("X-Account-Id")
		if apiKey == "" || accountID == "" {
			return ctx
		}
		baseURL := r.Header.Get("X-Passninja-Base")
		if baseURL == "" {
			baseURL = defaultBaseURL
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
