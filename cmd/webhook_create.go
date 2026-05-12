package cmd

import (
	"fmt"

	"github.com/flomio/passninja-cli/pkg/api"
	"github.com/flomio/passninja-cli/pkg/output"
	"github.com/flomio/passninja-cli/pkg/utils"
	"github.com/spf13/cobra"
)

var (
	whCreateName         string
	whCreateURL          string
	whCreateEvents       []string
	whCreateAuthMethod   string
	whCreatePassTemplate string
)

var webhookCreateCmd = &cobra.Command{
	Use:   "create",
	Short: "Provision a new webhook subscription",
	RunE: func(cmd *cobra.Command, _ []string) error {
		if whCreateName == "" || whCreateURL == "" || len(whCreateEvents) == 0 {
			return fmt.Errorf("--name, --url, and at least one --event are required")
		}
		client, err := clientFromContext(cmd.Context())
		if err != nil {
			return err
		}
		in := api.CreateWebhookInput{
			Name:             whCreateName,
			URL:              whCreateURL,
			SubscribedEvents: whCreateEvents,
		}
		if whCreateAuthMethod != "" {
			in.AuthMethod = whCreateAuthMethod
		}
		if whCreatePassTemplate != "" {
			ptID, err := utils.NormalizePassTemplateID(whCreatePassTemplate)
			if err != nil {
				return err
			}
			in.PassTemplate = ptID
		}
		w, err := client.CreateWebhook(cmd.Context(), in)
		if err != nil {
			return err
		}
		if output.CurrentMode() == output.ModeJSON {
			return output.PrintJSON(w)
		}
		output.WebhookDetailTable(w)
		output.Warn("Save this bearer token now — it will not be shown again.")
		return nil
	},
}

func init() {
	webhookCreateCmd.Flags().StringVar(&whCreateName, "name", "", "Webhook name (required)")
	webhookCreateCmd.Flags().StringVar(&whCreateURL, "url", "", "Receiver URL, must be https (required)")
	webhookCreateCmd.Flags().StringSliceVar(&whCreateEvents, "event", nil, "Event type to subscribe (repeatable, required)")
	webhookCreateCmd.Flags().StringVar(&whCreateAuthMethod, "auth-method", "", "bearer_token (default) | mtls")
	webhookCreateCmd.Flags().StringVar(&whCreatePassTemplate, "pass-template", "", "ptk_0x... to scope to one template; omit for account-wide")
	webhookCmd.AddCommand(webhookCreateCmd)
}
