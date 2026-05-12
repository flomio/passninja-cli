package cmd

import (
	"github.com/flomio/passninja-cli/pkg/output"
	"github.com/spf13/cobra"
)

var passTemplateListCmd = &cobra.Command{
	Use:   "list",
	Short: "List all pass templates for the active account",
	RunE: func(cmd *cobra.Command, _ []string) error {
		client, err := clientFromContext(cmd.Context())
		if err != nil {
			return err
		}
		items, err := client.ListPassTemplates(cmd.Context())
		if err != nil {
			return err
		}
		if output.CurrentMode() == output.ModeJSON {
			return output.PrintJSON(items)
		}
		output.PassTemplateTable(items)
		return nil
	},
}

func init() { passTemplateCmd.AddCommand(passTemplateListCmd) }
