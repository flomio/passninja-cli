package cmd

import (
	"fmt"

	"github.com/flomio/passninja-cli/pkg/api"
	"github.com/flomio/passninja-cli/pkg/output"
	"github.com/spf13/cobra"
)

var (
	readerCreateName         string
	readerCreateLocation     string
	readerCreateApplications []string
)

var readerCreateCmd = &cobra.Command{
	Use:   "create",
	Short: "Register a reader and mint its bearer token",
	Long: "Register a reader. Only --name, --location, and at least one\n" +
		"--application are needed; the hardware identity (serial, model,\n" +
		"firmware) is reported later by the reader host via heartbeat.\n\n" +
		"The bearer token is printed once and never again — save it, then pass\n" +
		"it to `passninja reader serve --token`, the VTAP Cloud application\n" +
		"parameters, or the Famoco managed config.",
	RunE: func(cmd *cobra.Command, _ []string) error {
		if readerCreateName == "" || readerCreateLocation == "" {
			return fmt.Errorf("--name and --location are required")
		}
		if len(readerCreateApplications) == 0 {
			return fmt.Errorf("at least one --application is required")
		}
		client, err := clientFromContext(cmd.Context())
		if err != nil {
			return err
		}
		r, err := client.CreateReader(cmd.Context(), api.CreateReaderInput{
			Name:         readerCreateName,
			Location:     readerCreateLocation,
			Applications: readerCreateApplications,
		})
		if err != nil {
			return err
		}
		if output.CurrentMode() == output.ModeJSON {
			return output.PrintJSON(r)
		}
		output.ReaderDetailTable(r)
		if r.Token != "" {
			output.Warn("Save this reader token now — it will not be shown again.")
		}
		return nil
	},
}

func init() {
	readerCreateCmd.Flags().StringVar(&readerCreateName, "name", "", "Reader name, e.g. \"Front gate\" (required)")
	readerCreateCmd.Flags().StringVar(&readerCreateLocation, "location", "", "Where the reader is installed (required)")
	readerCreateCmd.Flags().StringSliceVar(&readerCreateApplications, "application", nil, "app_0x... to bind (repeatable, at least one required)")
	readerCmd.AddCommand(readerCreateCmd)
}
