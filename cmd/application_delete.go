package cmd

import (
	"github.com/flomio/passninja-cli/pkg/output"
	"github.com/flomio/passninja-cli/pkg/utils"
	"github.com/spf13/cobra"
)

var applicationDeleteYes bool

var applicationDeleteCmd = &cobra.Command{
	Use:   "delete <app_0x...>",
	Short: "Delete a scan-event application",
	Long:  "Delete an application. The API refuses (409) while it is still bound to a reader — unbind it first.",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := clientFromContext(cmd.Context())
		if err != nil {
			return err
		}
		ok, err := utils.ConfirmYes("Delete application "+args[0]+"?", applicationDeleteYes)
		if err != nil {
			return err
		}
		if !ok {
			output.Warn("Cancelled.")
			return nil
		}
		if err := client.DeleteApplication(cmd.Context(), args[0]); err != nil {
			return err
		}
		output.Success("Deleted application %s", args[0])
		return nil
	},
}

func init() {
	applicationDeleteCmd.Flags().BoolVar(&applicationDeleteYes, "yes", false, "skip the confirmation prompt")
	applicationCmd.AddCommand(applicationDeleteCmd)
}
