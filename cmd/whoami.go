package cmd

import (
	"fmt"
	"time"

	"github.com/flomio/passninja-cli/pkg/oauth"
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
		}
		credential := "API key " + maskAPIKey(client.APIKey)
		if ts, ok := client.Tokens.(*oauth.TokenSource); ok {
			info["auth"] = "login session"
			credential = "login session"
			if end := ts.Session().SessionExpiresAt; !end.IsZero() {
				info["session_expires_at"] = end.UTC().Format(time.RFC3339)
				credential = "login session (ends " + end.Local().Format("Jan 2, 2006 15:04") + ")"
			}
		} else {
			info["auth"] = "api key"
			info["api_key"] = maskAPIKey(client.APIKey)
		}
		switch output.CurrentMode() {
		case output.ModeJSON:
			return output.PrintJSON(info)
		case output.ModePlaintext:
			fmt.Printf("%s\t%s\t%s\n", info["account_id"], info["base_url"], credential)
		default:
			output.PrintTable(
				[]string{"Account", "Base URL", "Credential"},
				[][]string{{info["account_id"], info["base_url"], credential}},
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
