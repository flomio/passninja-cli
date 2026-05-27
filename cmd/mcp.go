package cmd

import (
	"os"

	"github.com/flomio/passninja-cli/pkg/mcp"
	"github.com/flomio/passninja-cli/pkg/output"
	"github.com/spf13/cobra"
)

var mcpCmd = &cobra.Command{
	Use:   "mcp",
	Short: "Start the PassNinja MCP server (stdio)",
	Long: "Starts a Model Context Protocol server over stdio, exposing the\n" +
		"full PassNinja API surface as tools that LLM clients (Claude Desktop,\n" +
		"Cursor, etc.) can call. Credentials are resolved exactly like the\n" +
		"rest of the CLI: flag > PASSNINJA_API_KEY/ACCOUNT_ID env > ~/.passninja-auth.json.",
	SilenceUsage:  true,
	SilenceErrors: true,
	RunE: func(cmd *cobra.Command, _ []string) error {
		// Stdout is the JSON-RPC transport in stdio mode. Redirect every
		// other writer to stderr so no accidental print ever corrupts the
		// protocol stream.
		cmd.SetOut(os.Stderr)
		output.SetStdout(os.Stderr)

		client, err := clientFromContext(cmd.Context())
		if err != nil {
			return err
		}
		return mcp.Serve(cmd.Context(), client, mcp.ServerInfo{
			Name:    "passninja",
			Version: buildVersion,
		})
	},
}

func init() { rootCmd.AddCommand(mcpCmd) }
