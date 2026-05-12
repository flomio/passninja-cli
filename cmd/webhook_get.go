package cmd

import (
	"github.com/flomio/passninja-cli/pkg/output"
	"github.com/spf13/cobra"
)

var webhookGetCmd = &cobra.Command{
	Use:   "get <webhook_id>",
	Short: "Show one webhook subscription",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := clientFromContext(cmd.Context())
		if err != nil {
			return err
		}
		w, err := client.GetWebhook(cmd.Context(), args[0])
		if err != nil {
			return err
		}
		if output.CurrentMode() == output.ModeJSON {
			return output.PrintJSON(w)
		}
		output.WebhookDetailTable(w)
		return nil
	},
}

func init() { webhookCmd.AddCommand(webhookGetCmd) }
