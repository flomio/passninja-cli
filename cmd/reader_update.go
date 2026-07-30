package cmd

import (
	"github.com/flomio/passninja-cli/pkg/api"
	"github.com/flomio/passninja-cli/pkg/output"
	"github.com/spf13/cobra"
)

var (
	readerUpdateName         string
	readerUpdateLocation     string
	readerUpdateStatus       string
	readerUpdateApplications []string
)

var readerUpdateCmd = &cobra.Command{
	Use:   "update <reader_id>",
	Short: "Update a reader's name, location, status, or application bindings",
	Long: "Patch a reader. Passing --application replaces the whole binding set;\n" +
		"newly added applications are validated against the 3-Apple / 3-Google\n" +
		"limit and the zero-live-passes pairing rule, while bindings the reader\n" +
		"already had stay exempt.",
	Args: cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := clientFromContext(cmd.Context())
		if err != nil {
			return err
		}
		var in api.UpdateReaderInput
		if cmd.Flags().Changed("name") {
			in.Name = &readerUpdateName
		}
		if cmd.Flags().Changed("location") {
			in.Location = &readerUpdateLocation
		}
		if cmd.Flags().Changed("status") {
			in.Status = &readerUpdateStatus
		}
		if cmd.Flags().Changed("application") {
			in.Applications = readerUpdateApplications
		}
		r, err := client.UpdateReader(cmd.Context(), args[0], in)
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

func init() {
	readerUpdateCmd.Flags().StringVar(&readerUpdateName, "name", "", "New reader name")
	readerUpdateCmd.Flags().StringVar(&readerUpdateLocation, "location", "", "New location")
	readerUpdateCmd.Flags().StringVar(&readerUpdateStatus, "status", "", "active | revoked")
	readerUpdateCmd.Flags().StringSliceVar(&readerUpdateApplications, "application", nil, "app_0x... bindings (repeatable; replaces the current set)")
	readerCmd.AddCommand(readerUpdateCmd)
}
