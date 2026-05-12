package cmd

import (
	"github.com/flomio/passninja-cli/pkg/output"
	"github.com/flomio/passninja-cli/pkg/utils"
	"github.com/spf13/cobra"
)

var passRawCmd = &cobra.Command{
	Use:   "raw <ptk_0x...> <pass_id>",
	Short: "Show the full raw pass.json payload",
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
		raw, err := client.GetRawPass(cmd.Context(), id, args[1])
		if err != nil {
			return err
		}
		return output.PrintJSON(raw)
	},
}

func init() { passCmd.AddCommand(passRawCmd) }
