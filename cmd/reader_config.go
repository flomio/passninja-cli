package cmd

import (
	"github.com/flomio/passninja-cli/pkg/output"
	"github.com/spf13/cobra"
)

var readerConfigCmd = &cobra.Command{
	Use:   "config <reader_id>",
	Short: "Show the merged reader config across the reader's bound templates",
	Long: "Fetch the reader config (Apple merchant id, Google collector id + key\n" +
		"version, and the EC decryption keys) merged across every template this\n" +
		"reader is bound to — what a reader host loads onto the hardware. Only\n" +
		"decryption keys are returned; signing material is never shown.",
	Args: cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := clientFromContext(cmd.Context())
		if err != nil {
			return err
		}
		cfg, err := client.GetReaderMergedConfig(cmd.Context(), args[0])
		if err != nil {
			return err
		}
		return output.PrintJSON(cfg)
	},
}

func init() { readerCmd.AddCommand(readerConfigCmd) }
