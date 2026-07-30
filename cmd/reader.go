package cmd

import "github.com/spf13/cobra"

var readerCmd = &cobra.Command{
	Use:     "reader",
	Aliases: []string{"readers"},
	Short:   "Manage NFC readers and run a reader host (premium)",
	Long: "A reader is a registered NFC reader on your account. It binds to one\n" +
		"or more applications; the templates it can scan derive from those\n" +
		"bindings (at most 3 Apple-template and 3 Google-template applications).\n\n" +
		"Each reader gets a bearer token at creation, shown exactly once, which\n" +
		"the reader host uses for scan / heartbeat / pre-sign calls — never your\n" +
		"account API key. Use `reader serve` to run this machine as that host.",
}

func init() { rootCmd.AddCommand(readerCmd) }
