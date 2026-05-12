package cmd

import (
	"encoding/json"

	"github.com/flomio/passninja-cli/pkg/output"
	"github.com/flomio/passninja-cli/pkg/utils"
	"github.com/spf13/cobra"
)

var passListCmd = &cobra.Command{
	Use:   "list <ptk_0x...>",
	Short: "List all issued passes for a template",
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
		passes, err := client.ListPasses(cmd.Context(), id)
		if err != nil {
			return err
		}
		if output.CurrentMode() == output.ModeJSON {
			return output.PrintJSON(passes)
		}
		// Table mode: extract a couple of well-known columns if present.
		headers := []string{"Pass ID", "Created", "URL"}
		rows := make([][]string, 0, len(passes))
		for _, p := range passes {
			rows = append(rows, []string{
				toStr(p["passId"]),
				toStr(p["createdAt"]),
				toStr(p["url"]),
			})
		}
		output.PrintTable(headers, rows)
		return nil
	},
}

func init() { passCmd.AddCommand(passListCmd) }

// toStr coerces an `any` (from a JSON Pass) to a printable string.
func toStr(v any) string {
	if v == nil {
		return ""
	}
	if s, ok := v.(string); ok {
		return s
	}
	if b, err := json.Marshal(v); err == nil {
		return string(b)
	}
	return ""
}
