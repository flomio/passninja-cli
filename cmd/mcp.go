package cmd

import (
	"os"

	"github.com/flomio/passninja-cli/pkg/mcp"
	"github.com/flomio/passninja-cli/pkg/output"
	"github.com/spf13/cobra"
)

var (
	mcpHTTPAddr      string
	mcpHTTPEndpoint  string
	mcpAuthServerURL string
	mcpPublicURL     string
)

var mcpCmd = &cobra.Command{
	Use:   "mcp",
	Short: "Start the PassNinja MCP server (stdio by default; --http for remote use)",
	Long: "Starts a Model Context Protocol server exposing the full PassNinja API\n" +
		"surface as 19 tools.\n\n" +
		"Default mode is stdio for local clients (Claude Desktop, Cursor, Cline).\n" +
		"Credentials are resolved once from flag > PASSNINJA_API_KEY/ACCOUNT_ID env\n" +
		"> ~/.passninja-auth.json.\n\n" +
		"With --http <addr> the server speaks streamable HTTP at /mcp for remote\n" +
		"multi-tenant clients (ChatGPT Apps SDK, hosted Claude.ai deployments,\n" +
		"shared team instances). In HTTP mode each request supplies its own\n" +
		"credentials via X-Api-Key + X-Account-Id headers; the server holds no\n" +
		"global credentials.",
	SilenceUsage:  true,
	SilenceErrors: true,
	RunE: func(cmd *cobra.Command, _ []string) error {
		info := mcp.ServerInfo{Name: "passninja", Version: buildVersion}

		if mcpHTTPAddr != "" {
			// HTTP mode: no startup credentials, per-request auth via headers.
			return mcp.ServeHTTP(cmd.Context(), info, mcp.HTTPOptions{
				Addr:          mcpHTTPAddr,
				EndpointPath:  mcpHTTPEndpoint,
				UserAgent:     "passninja-mcp/" + buildVersion,
				AuthServerURL: mcpAuthServerURL,
				PublicURL:     mcpPublicURL,
			})
		}

		// Stdio mode: build the credential-resolved client now and stream over
		// stdin/stdout. Stdout is the JSON-RPC transport so every other writer
		// is redirected to stderr to keep the protocol stream clean.
		cmd.SetOut(os.Stderr)
		output.SetStdout(os.Stderr)

		client, err := buildClient()
		if err != nil {
			return err
		}
		return mcp.Serve(cmd.Context(), client, info)
	},
}

func init() {
	mcpCmd.Flags().StringVar(&mcpHTTPAddr, "http", "",
		"listen address for streamable-HTTP transport (e.g. ':8080'); when empty, serves over stdio")
	mcpCmd.Flags().StringVar(&mcpHTTPEndpoint, "http-endpoint", "/mcp",
		"URL path the HTTP transport serves at (--http only)")
	mcpCmd.Flags().StringVar(&mcpAuthServerURL, "auth-server-url", "",
		"OAuth authorization server advertised in protected-resource metadata (--http only; defaults to https://auth.passninja.com)")
	mcpCmd.Flags().StringVar(&mcpPublicURL, "public-url", "",
		"externally-visible origin for metadata URLs (--http only; defaults to the request Host)")
	rootCmd.AddCommand(mcpCmd)
}
