package cmd

import (
	"github.com/flomio/passninja-cli/pkg/output"
	"github.com/flomio/passninja-cli/pkg/utils"
	"github.com/spf13/cobra"
)

var passTemplateReaderConfigCmd = &cobra.Command{
	Use:   "reader-config <ptk_0x...>",
	Short: "Show the NFC reader config (merchant id, collector, EC keys) for a template",
	Long: "Fetch the reader-agnostic configuration a physical NFC pass reader needs\n" +
		"to read this template's Apple (VAS) and/or Google (Smart Tap) passes:\n" +
		"the Apple merchant id, Google collector id + key version, and the EC\n" +
		"decryption keys (SEC1 PEM). Output is JSON. It carries no reader-specific\n" +
		"details (key slots, file names) — the consuming device tooling decides\n" +
		"those. Only decryption keys are returned; signing material is never shown.",
	Args: cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := clientFromContext(cmd.Context())
		if err != nil {
			return err
		}
		id, err := utils.NormalizePassTemplateID(args[0])
		if err != nil {
			return err
		}
		cfg, err := client.GetReaderConfig(cmd.Context(), id)
		if err != nil {
			return err
		}
		return output.PrintJSON(cfg)
	},
}

func init() { passTemplateCmd.AddCommand(passTemplateReaderConfigCmd) }
