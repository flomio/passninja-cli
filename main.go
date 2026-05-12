package main

import (
	"os"

	"github.com/flomio/passninja-cli/cmd"
)

var (
	version   = "dev"
	commit    = "unknown"
	buildDate = "unknown"
)

func main() {
	cmd.SetBuildInfo(version, commit, buildDate)
	if err := cmd.Execute(); err != nil {
		os.Exit(1)
	}
}
