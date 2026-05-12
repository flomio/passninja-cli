package cmd

import (
	"github.com/flomio/passninja-cli/pkg/api"
	"github.com/flomio/passninja-cli/pkg/output"
	"github.com/flomio/passninja-cli/pkg/utils"
	"github.com/spf13/cobra"
)

var (
	passUpdateFields  []string
	passUpdateData    string
	passUpdateReplace bool
)

var passUpdateCmd = &cobra.Command{
	Use:   "update <ptk_0x...> <pass_id>",
	Short: "Update an existing pass (PATCH by default; --replace for PUT)",
	Args:  cobra.ExactArgs(2),
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := clientFromContext(cmd.Context())
		if err != nil {
			return err
		}
		id, err := utils.NormalizePassTemplateID(args[0])
		if err != nil {
			return err
		}
		fields, err := utils.ParseFieldFlags(passUpdateFields, passUpdateData)
		if err != nil {
			return err
		}
		var updated api.Pass
		if passUpdateReplace {
			updated, err = client.ReplacePass(cmd.Context(), id, args[1], fields)
		} else {
			updated, err = client.PatchPass(cmd.Context(), id, args[1], fields)
		}
		if err != nil {
			return err
		}
		if output.CurrentMode() == output.ModeJSON {
			return output.PrintJSON(updated)
		}
		output.PassDetailTable(updated)
		return nil
	},
}

func init() {
	passUpdateCmd.Flags().StringSliceVar(&passUpdateFields, "field", nil, "field as k=v (repeatable)")
	passUpdateCmd.Flags().StringVar(&passUpdateData, "data", "", "raw JSON, @file.json, or - for stdin")
	passUpdateCmd.Flags().BoolVar(&passUpdateReplace, "replace", false, "use PUT (full replace) instead of PATCH")
	passCmd.AddCommand(passUpdateCmd)
}
