package cmd

import (
	"github.com/flomio/passninja-cli/pkg/output"
	"github.com/flomio/passninja-cli/pkg/utils"
	"github.com/spf13/cobra"
)

var passTemplateRequiredFieldsCmd = &cobra.Command{
	Use:   "required-fields <ptk_0x...>",
	Short: "Show the fields a CREATE or UPDATE call must set",
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
		fields, err := client.GetRequiredFields(cmd.Context(), id)
		if err != nil {
			return err
		}
		return output.PrintJSON(fields)
	},
}

func init() { passTemplateCmd.AddCommand(passTemplateRequiredFieldsCmd) }
