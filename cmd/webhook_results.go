package cmd

import (
	"github.com/flomio/passninja-cli/pkg/api"
	"github.com/flomio/passninja-cli/pkg/output"
	"github.com/spf13/cobra"
)

var (
	whResultsPage    int
	whResultsPerPage int
)

var webhookResultsCmd = &cobra.Command{
	Use:   "results <webhook_id>",
	Short: "Show delivery history for a webhook",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := clientFromContext(cmd.Context())
		if err != nil {
			return err
		}
		res, err := client.ListWebhookResults(cmd.Context(), args[0], api.PageOpts{Page: whResultsPage, PerPage: whResultsPerPage})
		if err != nil {
			return err
		}
		if output.CurrentMode() == output.ModeJSON {
			return output.PrintJSON(res)
		}
		output.WebhookResultsTable(res.WebhookResults)
		output.Info("page %d of %d (per_page=%d, total=%d)", res.Page, pageCount(res.Total, res.PerPage), res.PerPage, res.Total)
		return nil
	},
}

func init() {
	webhookResultsCmd.Flags().IntVar(&whResultsPage, "page", 0, "page number (1-indexed)")
	webhookResultsCmd.Flags().IntVar(&whResultsPerPage, "per-page", 0, "items per page (max 100)")
	webhookCmd.AddCommand(webhookResultsCmd)
}
