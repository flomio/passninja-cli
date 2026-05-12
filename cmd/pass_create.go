package cmd

import (
	"github.com/flomio/passninja-cli/pkg/output"
	"github.com/flomio/passninja-cli/pkg/utils"
	"github.com/spf13/cobra"
)

var (
	passCreateFields []string
	passCreateData   string
)

var passCreateCmd = &cobra.Command{
	Use:   "create <ptk_0x...>",
	Short: "Issue a new pass for the given template",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := clientFromContext(cmd.Context())
		if err != nil {
			return err
		}
		id, err := utils.NormalizePassTemplateID(args[0])
		if err != nil {
			return err
		}
		fields, err := utils.ParseFieldFlags(passCreateFields, passCreateData)
		if err != nil {
			return err
		}
		pass, err := client.CreatePass(cmd.Context(), id, fields)
		if err != nil {
			return err
		}
		if output.CurrentMode() == output.ModeJSON {
			return output.PrintJSON(pass)
		}
		output.PassDetailTable(pass)
		return nil
	},
}

func init() {
	passCreateCmd.Flags().StringSliceVar(&passCreateFields, "field", nil, "field as k=v (repeatable)")
	passCreateCmd.Flags().StringVar(&passCreateData, "data", "", "raw JSON, @file.json, or - for stdin")
	passCmd.AddCommand(passCreateCmd)
}
