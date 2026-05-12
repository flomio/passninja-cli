package cmd

import "github.com/spf13/cobra"

var passCmd = &cobra.Command{
	Use:     "pass",
	Aliases: []string{"passes"},
	Short:   "Manage issued passes",
}

func init() { rootCmd.AddCommand(passCmd) }
