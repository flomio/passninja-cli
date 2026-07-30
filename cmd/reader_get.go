package cmd

import (
	"github.com/flomio/passninja-cli/pkg/output"
	"github.com/spf13/cobra"
)

var readerGetCmd = &cobra.Command{
	Use:   "get <reader_id>",
	Short: "Show one reader with its health, hardware, and bindings",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := clientFromContext(cmd.Context())
		if err != nil {
			return err
		}
		r, err := client.GetReader(cmd.Context(), args[0])
		if err != nil {
			return err
		}
		if output.CurrentMode() == output.ModeJSON {
			return output.PrintJSON(r)
		}
		output.ReaderDetailTable(r)
		return nil
	},
}

func init() { readerCmd.AddCommand(readerGetCmd) }
