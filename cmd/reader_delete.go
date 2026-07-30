package cmd

import (
	"github.com/flomio/passninja-cli/pkg/output"
	"github.com/flomio/passninja-cli/pkg/utils"
	"github.com/spf13/cobra"
)

var readerDeleteYes bool

var readerDeleteCmd = &cobra.Command{
	Use:   "delete <reader_id>",
	Short: "Delete a reader",
	Long:  "Delete a reader and its application bindings. Its token stops working immediately; recorded scan history is removed with it.",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := clientFromContext(cmd.Context())
		if err != nil {
			return err
		}
		ok, err := utils.ConfirmYes("Delete reader "+args[0]+"? Its scan history will be removed too.", readerDeleteYes)
		if err != nil {
			return err
		}
		if !ok {
			output.Warn("Cancelled.")
			return nil
		}
		if err := client.DeleteReader(cmd.Context(), args[0]); err != nil {
			return err
		}
		output.Success("Deleted reader %s", args[0])
		return nil
	},
}

func init() {
	readerDeleteCmd.Flags().BoolVar(&readerDeleteYes, "yes", false, "skip the confirmation prompt")
	readerCmd.AddCommand(readerDeleteCmd)
}
