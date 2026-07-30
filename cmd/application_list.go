package cmd

import (
	"github.com/flomio/passninja-cli/pkg/output"
	"github.com/spf13/cobra"
)

var applicationListCmd = &cobra.Command{
	Use:   "list",
	Short: "List scan-event applications for the active account",
	RunE: func(cmd *cobra.Command, _ []string) error {
		client, err := clientFromContext(cmd.Context())
		if err != nil {
			return err
		}
		res, err := client.ListApplications(cmd.Context())
		if err != nil {
			return err
		}
		if output.CurrentMode() == output.ModeJSON {
			return output.PrintJSON(res)
		}
		output.ApplicationTable(res.Applications)
		return nil
	},
}

func init() { applicationCmd.AddCommand(applicationListCmd) }
