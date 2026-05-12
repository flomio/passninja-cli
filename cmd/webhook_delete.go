package cmd

import (
	"github.com/flomio/passninja-cli/pkg/output"
	"github.com/flomio/passninja-cli/pkg/utils"
	"github.com/spf13/cobra"
)

var webhookDeleteYes bool

var webhookDeleteCmd = &cobra.Command{
	Use:   "delete <webhook_id>",
	Short: "Destroy a webhook subscription",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := clientFromContext(cmd.Context())
		if err != nil {
			return err
		}
		ok, err := utils.ConfirmYes("Delete webhook "+args[0]+"? Result history will be removed too.", webhookDeleteYes)
		if err != nil {
			return err
		}
		if !ok {
			output.Warn("Cancelled.")
			return nil
		}
		if err := client.DeleteWebhook(cmd.Context(), args[0]); err != nil {
			return err
		}
		output.Success("Deleted webhook %s", args[0])
		return nil
	},
}

func init() {
	webhookDeleteCmd.Flags().BoolVar(&webhookDeleteYes, "yes", false, "skip the confirmation prompt")
	webhookCmd.AddCommand(webhookDeleteCmd)
}
