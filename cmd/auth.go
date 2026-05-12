package cmd

import (
	"context"
	"net/http"
	"time"

	"github.com/flomio/passninja-cli/pkg/api"
	"github.com/flomio/passninja-cli/pkg/auth"
	"github.com/flomio/passninja-cli/pkg/output"
	"github.com/spf13/cobra"
)

var authCmd = &cobra.Command{
	Use:   "auth",
	Short: "Authenticate and persist API credentials to ~/.passninja-auth.json",
	Long: `Saves your PassNinja API key + account id to ~/.passninja-auth.json (mode 0600).
Verifies the credentials by hitting /v1/pass_templates before persisting.`,
	RunE: func(cmd *cobra.Command, _ []string) error {
		creds, err := auth.Prompt(auth.PromptOptions{
			APIKey:    flagAPIKey,
			AccountID: flagAccountID,
			BaseURL:   flagBaseURL,
		})
		if err != nil {
			return err
		}

		// Verify before saving — bad creds shouldn't overwrite a working file.
		client := api.NewClient(
			creds.APIKey,
			creds.AccountID,
			api.WithBaseURL(creds.BaseURL),
			api.WithHTTPClient(&http.Client{Timeout: 15 * time.Second}),
			api.WithUserAgent("passninja-cli/"+buildVersion),
		)
		ctx, cancel := context.WithTimeout(cmd.Context(), 15*time.Second)
		defer cancel()
		if _, err := client.ListPassTemplates(ctx); err != nil {
			output.Error("Credential check failed: %v", err)
			return err
		}

		if err := auth.Save(creds); err != nil {
			return err
		}
		output.Success("Saved credentials to ~/.passninja-auth.json")
		return nil
	},
}

func init() { rootCmd.AddCommand(authCmd) }
