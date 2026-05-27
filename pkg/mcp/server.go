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

// Serve registers every tool against a new MCPServer and serves it over
// stdio. Blocks until stdin closes or the context is cancelled.
func Serve(ctx context.Context, client *api.Client, info ServerInfo) error {
	if client == nil {
		return fmt.Errorf("mcp.Serve: api client is nil")
	}

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

	registerTools(s, client)

	// ServeStdio reads JSON-RPC framed messages from stdin and writes to
	// stdout. We logged a one-line banner to stderr so an operator
	// hand-launching the binary can confirm it booted.
	fmt.Fprintf(os.Stderr, "[passninja mcp] ready, account=%s base=%s\n",
		client.AccountID, client.BaseURL)

	return server.ServeStdio(s, server.WithStdioContextFunc(func(_ context.Context) context.Context {
		// Propagate the Cobra-rooted context (signal handling, deadlines)
		// into every tool invocation.
		return ctx
	}))
}
