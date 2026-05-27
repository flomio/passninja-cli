// Package mcp exposes the PassNinja API as a Model Context Protocol server.
// It reuses pkg/api's Client for every call — the MCP layer is a thin
// adapter that translates MCP tool invocations into typed Go method calls
// and serializes responses back as JSON text content.
package mcp

import (
	"context"
	"fmt"
	"os"

	"github.com/flomio/passninja-cli/pkg/api"
	"github.com/mark3labs/mcp-go/server"
)

// ServerInfo is the identity advertised in the MCP `initialize` handshake.
type ServerInfo struct {
	Name    string
	Version string
}

// build wires a fresh MCPServer with all 18 tools registered. defaultClient
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

	s := build(info, nil)

	httpSrv := server.NewStreamableHTTPServer(s,
		server.WithEndpointPath(opts.EndpointPath),
		server.WithStateLess(true),
		server.WithHTTPContextFunc(httpContextFunc(opts.DefaultBaseURL, opts.UserAgent)),
	)

	fmt.Fprintf(os.Stderr, "[passninja mcp] http ready, listening on %s%s (default base=%s)\n",
		opts.Addr, opts.EndpointPath, opts.DefaultBaseURL)

	errCh := make(chan error, 1)
	go func() { errCh <- httpSrv.Start(opts.Addr) }()
	select {
	case <-ctx.Done():
		_ = httpSrv.Shutdown(context.Background())
		return ctx.Err()
	case err := <-errCh:
		return err
	}
}
