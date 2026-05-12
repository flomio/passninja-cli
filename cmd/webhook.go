package cmd

import "github.com/spf13/cobra"

var webhookCmd = &cobra.Command{
	Use:     "webhook",
	Aliases: []string{"webhooks"},
	Short:   "Manage webhook subscriptions (enterprise only)",
}

func init() { rootCmd.AddCommand(webhookCmd) }
