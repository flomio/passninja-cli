package cmd

import (
	"fmt"

	"github.com/flomio/passninja-cli/pkg/output"
	"github.com/spf13/cobra"
)

var versionCmd = &cobra.Command{
	Use:   "version",
	Short: "Print version, commit, and build date",
	RunE: func(_ *cobra.Command, _ []string) error {
		switch output.CurrentMode() {
		case output.ModeJSON:
			return output.PrintJSON(map[string]string{
				"version":   buildVersion,
				"commit":    buildCommit,
				"buildDate": buildDate,
			})
		case output.ModePlaintext:
			fmt.Printf("%s\t%s\t%s\n", buildVersion, buildCommit, buildDate)
			return nil
		default:
			fmt.Printf("passninja %s (commit %s, built %s)\n", buildVersion, buildCommit, buildDate)
			return nil
		}
	},
}

func init() { rootCmd.AddCommand(versionCmd) }
