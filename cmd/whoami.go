package cmd

import (
	"fmt"

	"github.com/flomio/passninja-cli/pkg/output"
	"github.com/spf13/cobra"
)

var whoamiCmd = &cobra.Command{
	Use:   "whoami",
	Short: "Show the active credential / account",
	RunE: func(cmd *cobra.Command, _ []string) error {
		client, err := clientFromContext(cmd.Context())
		if err != nil {
			return err
		}
		info := map[string]string{
			"account_id": client.AccountID,
			"base_url":   client.BaseURL,
			"api_key":    maskAPIKey(client.APIKey),
		}
		switch output.CurrentMode() {
		case output.ModeJSON:
			return output.PrintJSON(info)
		case output.ModePlaintext:
			fmt.Printf("%s\t%s\t%s\n", info["account_id"], info["base_url"], info["api_key"])
		default:
			output.PrintTable(
				[]string{"Account", "Base URL", "API key"},
				[][]string{{info["account_id"], info["base_url"], info["api_key"]}},
			)
		}
		return nil
	},
}

func init() { rootCmd.AddCommand(whoamiCmd) }

func maskAPIKey(s string) string {
	if len(s) <= 8 {
		return "****"
	}
	return s[:4] + "..." + s[len(s)-4:]
}
