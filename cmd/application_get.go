package cmd

import (
	"github.com/flomio/passninja-cli/pkg/output"
	"github.com/spf13/cobra"
)

var applicationGetCmd = &cobra.Command{
	Use:   "get <app_0x...>",
	Short: "Show one scan-event application",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := clientFromContext(cmd.Context())
		if err != nil {
			return err
		}
		app, err := client.GetApplication(cmd.Context(), args[0])
		if err != nil {
			return err
		}
		if output.CurrentMode() == output.ModeJSON {
			return output.PrintJSON(app)
		}
		output.ApplicationDetailTable(app)
		return nil
	},
}

func init() { applicationCmd.AddCommand(applicationGetCmd) }
