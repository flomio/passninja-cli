package cmd

import (
	"github.com/flomio/passninja-cli/pkg/output"
	"github.com/flomio/passninja-cli/pkg/utils"
	"github.com/spf13/cobra"
)

var passDeleteYes bool

var passDeleteCmd = &cobra.Command{
	Use:   "delete <ptk_0x...> <pass_id>",
	Short: "Revoke an issued pass",
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
		ok, err := utils.ConfirmYes("Delete pass "+args[1]+" of "+id+"?", passDeleteYes)
		if err != nil {
			return err
		}
		if !ok {
			output.Warn("Cancelled.")
			return nil
		}
		if err := client.DeletePass(cmd.Context(), id, args[1]); err != nil {
			return err
		}
		output.Success("Deleted %s", args[1])
		return nil
	},
}

func init() {
	passDeleteCmd.Flags().BoolVar(&passDeleteYes, "yes", false, "skip the confirmation prompt")
	passCmd.AddCommand(passDeleteCmd)
}
