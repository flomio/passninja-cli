package cmd

import "github.com/spf13/cobra"

var applicationCmd = &cobra.Command{
	Use:     "application",
	Aliases: []string{"applications", "app"},
	Short:   "Manage scan-event applications (premium)",
	Long: "An application defines what happens when a reader scans a pass.\n" +
		"Each application is bound to exactly one pass template and is one of\n" +
		"three kinds: log (record every scan), validate (accept/reject the tap),\n" +
		"or forward (relay to your own endpoint). Readers bind to applications.",
}

func init() { rootCmd.AddCommand(applicationCmd) }
