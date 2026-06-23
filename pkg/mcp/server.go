// Package mcp exposes the PassNinja API as a Model Context Protocol server.
// It reuses pkg/api's Client for every call — the MCP layer is a thin
// adapter that translates MCP tool invocations into typed Go method calls
// and serializes responses back as JSON text content.
package mcp

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/flomio/passninja-cli/pkg/api"
	mcplib "github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"
)

// ServerInfo is the identity advertised in the MCP `initialize` handshake.
type ServerInfo struct {
	Name    string
	Version string
}

// build wires a fresh MCPServer with all 19 tools registered. defaultClient
// is the credential-resolved client used in stdio mode (single-tenant); in
// HTTP mode it can be nil and each request supplies its own credentials via
// headers (see pkg/mcp/auth.go).
func build(info ServerInfo, defaultClient *api.Client) *server.MCPServer {
	name := info.Name
	if name == "" {
		name = "passninja"
	}
	version := info.Version
	if version == "" {
		version = "dev"
	}
	s := server.NewMCPServer(
		name,
		version,
		server.WithToolCapabilities(true),
		server.WithLogging(),
		// Server identity surfaced by clients on connector cards
		// (initialize → serverInfo per the 2025-11-25 MCP spec).
		server.WithTitle("PassNinja"),
		server.WithDescription("Create, issue, update, and manage NFC-enabled Apple Wallet and Google Wallet passes — pass templates, issued passes, and webhooks — backed by the PassNinja API."),
		server.WithWebsiteURL("https://passninja.com"),
		server.WithIcons(mcplib.Icon{
			Src:      "https://api.passninja.com/images/website/passninja-mark-square.svg",
			MIMEType: "image/svg+xml",
			Sizes:    []string{"any"},
		}),
	)
	registerTools(s, defaultClient)
	return s
}

// Serve registers every tool against a new MCPServer and serves it over
// stdio. Blocks until stdin closes or the context is cancelled.
//
// Single-tenant: all requests use the supplied client. Suitable for the
// .mcpb / Claude Desktop install path where the user's credentials are
// resolved once from env vars or the on-disk auth file at startup.
func Serve(ctx context.Context, client *api.Client, info ServerInfo) error {
	if client == nil {
		return fmt.Errorf("mcp.Serve: api client is nil")
	}
	s := build(info, client)

	fmt.Fprintf(os.Stderr, "[passninja mcp] stdio ready, account=%s base=%s\n",
		client.AccountID, client.BaseURL)

	return server.ServeStdio(s, server.WithStdioContextFunc(func(_ context.Context) context.Context {
		// Propagate the Cobra-rooted context (signal handling, deadlines)
		// into every tool invocation.
		return ctx
	}))
}

// HTTPOptions configures the streamable-HTTP transport.
type HTTPOptions struct {
	// Addr is the TCP listen address, e.g. ":8080" or "127.0.0.1:8080".
	Addr string
	// EndpointPath is the URL path for the MCP endpoint. Defaults to "/mcp".
	EndpointPath string
	// DefaultBaseURL is the PassNinja API base URL used when a request
	// omits the X-Passninja-Base header. Defaults to api.DefaultBaseURL.
	DefaultBaseURL string
	// UserAgent stamped on outgoing PassNinja API calls.
	UserAgent string
	// AuthServerURL is the OAuth authorization server advertised in the
	// protected-resource metadata. Defaults to DefaultAuthServerURL.
	AuthServerURL string
	// PublicURL overrides the externally-visible origin used to build
	// metadata URLs. When empty it is derived per-request from the Host
	// and X-Forwarded-Proto headers (correct behind Heroku's TLS router).
	PublicURL string
}

// ServeHTTP boots the MCP server in streamable-HTTP mode for remote
// multi-tenant use (ChatGPT Apps SDK, hosted Claude.ai deployments, team
// shared instances). Each incoming request supplies its own credentials
// via X-Api-Key + X-Account-Id headers (see pkg/mcp/auth.go); the server
// holds no global credentials.
//
// Blocks until the listener returns. Cancel ctx to trigger shutdown.
func ServeHTTP(ctx context.Context, info ServerInfo, opts HTTPOptions) error {
	if opts.Addr == "" {
		return fmt.Errorf("mcp.ServeHTTP: Addr is required")
	}
	if opts.EndpointPath == "" {
		opts.EndpointPath = "/mcp"
	}
	if opts.DefaultBaseURL == "" {
		opts.DefaultBaseURL = api.DefaultBaseURL
	}
	if opts.UserAgent == "" {
		opts.UserAgent = "passninja-mcp/dev"
	}
	if opts.AuthServerURL == "" {
		opts.AuthServerURL = DefaultAuthServerURL
	}

	s := build(info, nil)

	httpSrv := server.NewStreamableHTTPServer(s,
		server.WithEndpointPath(opts.EndpointPath),
		server.WithStateLess(true),
		server.WithHTTPContextFunc(httpContextFunc(opts.DefaultBaseURL, opts.UserAgent)),
	)

	// Compose the MCP endpoint behind an OAuth challenge gate, and serve the
	// RFC 9728 protected-resource metadata that OAuth-capable MCP clients use
	// to discover the authorization server (auth.passninja.com).
	mux := http.NewServeMux()
	mux.HandleFunc(ProtectedResourcePath, protectedResourceMetadata(opts.AuthServerURL, opts.PublicURL))
	mux.Handle(opts.EndpointPath, oauthChallengeGate(httpSrv, opts.PublicURL))

	// OpenAI Apps SDK domain-ownership verification: serve the challenge
	// token (set via OPENAI_APPS_CHALLENGE_TOKEN) as plain text at the
	// origin-root well-known URL. Public, unauthenticated, env-driven so the
	// token can rotate without a code change. Absent token → no route (404).
	if tok := strings.TrimSpace(os.Getenv("OPENAI_APPS_CHALLENGE_TOKEN")); tok != "" {
		mux.HandleFunc("/.well-known/openai-apps-challenge", func(w http.ResponseWriter, _ *http.Request) {
			w.Header().Set("Content-Type", "text/plain; charset=utf-8")
			_, _ = w.Write([]byte(tok))
		})
	}

	srv := &http.Server{Addr: opts.Addr, Handler: mux}

	fmt.Fprintf(os.Stderr, "[passninja mcp] http ready, listening on %s%s (default base=%s, auth=%s)\n",
		opts.Addr, opts.EndpointPath, opts.DefaultBaseURL, opts.AuthServerURL)

	errCh := make(chan error, 1)
	go func() { errCh <- srv.ListenAndServe() }()
	select {
	case <-ctx.Done():
		_ = srv.Shutdown(context.Background())
		return ctx.Err()
	case err := <-errCh:
		return err
	}
}
