package cmd

import (
	"github.com/flomio/passninja-cli/pkg/api"
	"github.com/flomio/passninja-cli/pkg/output"
	"github.com/flomio/passninja-cli/pkg/utils"
	"github.com/spf13/cobra"
)

var (
	whListPage         int
	whListPerPage      int
	whListPassTemplate string
)

var webhookListCmd = &cobra.Command{
	Use:   "list",
	Short: "List webhook subscriptions for the active account",
	RunE: func(cmd *cobra.Command, _ []string) error {
		client, err := clientFromContext(cmd.Context())
		if err != nil {
			return err
		}
		opts := api.ListWebhookOpts{
			PageOpts: api.PageOpts{Page: whListPage, PerPage: whListPerPage},
		}
		if whListPassTemplate != "" {
			id, err := utils.NormalizePassTemplateID(whListPassTemplate)
			if err != nil {
				return err
			}
			opts.PassTemplate = id
		}
		res, err := client.ListWebhooks(cmd.Context(), opts)
		if err != nil {
			return err
		}
		if output.CurrentMode() == output.ModeJSON {
			return output.PrintJSON(res)
		}
		output.WebhookTable(res.Webhooks)
		output.Info("page %d of %d (per_page=%d, total=%d)", res.Page, pageCount(res.Total, res.PerPage), res.PerPage, res.Total)
		return nil
	},
}

func init() {
	webhookListCmd.Flags().IntVar(&whListPage, "page", 0, "page number (1-indexed)")
	webhookListCmd.Flags().IntVar(&whListPerPage, "per-page", 0, "items per page (max 100)")
	webhookListCmd.Flags().StringVar(&whListPassTemplate, "pass-template", "", "filter by ptk_0x...")
	webhookCmd.AddCommand(webhookListCmd)
}

func pageCount(total, per int) int {
	if per <= 0 {
		per = 50
	}
	if total == 0 {
		return 1
	}
	return (total + per - 1) / per
}
