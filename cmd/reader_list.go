package cmd

import (
	"github.com/flomio/passninja-cli/pkg/output"
	"github.com/spf13/cobra"
)

var readerListCmd = &cobra.Command{
	Use:   "list",
	Short: "List readers registered to the active account",
	RunE: func(cmd *cobra.Command, _ []string) error {
		client, err := clientFromContext(cmd.Context())
		if err != nil {
			return err
		}
		res, err := client.ListReaders(cmd.Context())
		if err != nil {
			return err
		}
		if output.CurrentMode() == output.ModeJSON {
			return output.PrintJSON(res)
		}
		output.ReaderTable(res.Readers)
		return nil
	},
}

func init() { readerCmd.AddCommand(readerListCmd) }
