package cmd

import (
	"github.com/flomio/passninja-cli/pkg/api"
	"github.com/flomio/passninja-cli/pkg/output"
	"github.com/flomio/passninja-cli/pkg/utils"
	"github.com/spf13/cobra"
)

var passTemplateGetCmd = &cobra.Command{
	Use:   "get <ptk_0x...>",
	Short: "Show one pass template",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := clientFromContext(cmd.Context())
		if err != nil {
			return err
		}
		id, err := utils.NormalizePassTemplateID(args[0])
		if err != nil {
			return err
		}
		pt, err := client.GetPassTemplate(cmd.Context(), id)
		if err != nil {
			return err
		}
		if output.CurrentMode() == output.ModeJSON {
			return output.PrintJSON(pt)
		}
		output.PassTemplateTable([]api.PassTemplate{*pt})
		return nil
	},
}

func init() { passTemplateCmd.AddCommand(passTemplateGetCmd) }
