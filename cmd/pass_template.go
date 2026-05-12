package cmd

import "github.com/spf13/cobra"

// passTemplateCmd is the parent for `passninja pass-template <subcommand>`.
// Each subcommand attaches itself in its own file's init().
var passTemplateCmd = &cobra.Command{
	Use:     "pass-template",
	Aliases: []string{"pass-templates", "passtemplate", "pt"},
	Short:   "Manage pass templates",
}

func init() { rootCmd.AddCommand(passTemplateCmd) }
