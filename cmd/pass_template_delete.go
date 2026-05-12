package cmd

import (
	"github.com/flomio/passninja-cli/pkg/output"
	"github.com/flomio/passninja-cli/pkg/utils"
	"github.com/spf13/cobra"
)

var ptDeleteYes bool

var passTemplateDeleteCmd = &cobra.Command{
	Use:   "delete <ptk_0x...>",
	Short: "Destroy a pass template (enterprise only)",
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
		ok, err := utils.ConfirmYes("Delete pass template "+id+"? This is irreversible.", ptDeleteYes)
		if err != nil {
			return err
		}
		if !ok {
			output.Warn("Cancelled.")
			return nil
		}
		if err := client.DeletePassTemplate(cmd.Context(), id); err != nil {
			return err
		}
		output.Success("Deleted %s", id)
		return nil
	},
}

func init() {
	passTemplateDeleteCmd.Flags().BoolVar(&ptDeleteYes, "yes", false, "skip the confirmation prompt")
	passTemplateCmd.AddCommand(passTemplateDeleteCmd)
}
