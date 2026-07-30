package cmd

import (
	"github.com/flomio/passninja-cli/pkg/output"
	"github.com/flomio/passninja-cli/pkg/utils"
	"github.com/spf13/cobra"
)

var readerRotateYes bool

var readerRotateTokenCmd = &cobra.Command{
	Use:   "rotate-token <reader_id>",
	Short: "Mint a new bearer token for a reader",
	Long:  "Rotate the reader's bearer token. The previous token stops working immediately, so update the reader host before or right after rotating. The new token is shown exactly once.",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := clientFromContext(cmd.Context())
		if err != nil {
			return err
		}
		ok, err := utils.ConfirmYes("Rotate the token for reader "+args[0]+"? The current token stops working immediately.", readerRotateYes)
		if err != nil {
			return err
		}
		if !ok {
			output.Warn("Cancelled.")
			return nil
		}
		res, err := client.RotateReaderToken(cmd.Context(), args[0])
		if err != nil {
			return err
		}
		if output.CurrentMode() == output.ModeJSON {
			return output.PrintJSON(res)
		}
		output.PrintTable([]string{"Field", "Value"}, [][]string{
			{"Reader", res.ID},
			{"Token", res.Token},
		})
		output.Warn("Save this reader token now — it will not be shown again.")
		return nil
	},
}

func init() {
	readerRotateTokenCmd.Flags().BoolVar(&readerRotateYes, "yes", false, "skip the confirmation prompt")
	readerCmd.AddCommand(readerRotateTokenCmd)
}
