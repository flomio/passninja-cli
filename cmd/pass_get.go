package cmd

import (
	"github.com/flomio/passninja-cli/pkg/output"
	"github.com/flomio/passninja-cli/pkg/utils"
	"github.com/spf13/cobra"
)

var passGetCmd = &cobra.Command{
	Use:   "get <ptk_0x...> <pass_id>",
	Short: "Show one issued pass",
	Args:  cobra.ExactArgs(2),
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := clientFromContext(cmd.Context())
		if err != nil {
			return err
		}
		id, err := utils.NormalizePassTemplateID(args[0])
		if err != nil {
			return err
		}
		p, err := client.GetPass(cmd.Context(), id, args[1])
		if err != nil {
			return err
		}
		if output.CurrentMode() == output.ModeJSON {
			return output.PrintJSON(p)
		}
		output.PassDetailTable(p)
		return nil
	},
}

func init() { passCmd.AddCommand(passGetCmd) }
