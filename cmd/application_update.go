package cmd

import (
	"github.com/flomio/passninja-cli/pkg/api"
	"github.com/flomio/passninja-cli/pkg/output"
	"github.com/spf13/cobra"
)

var (
	appUpdateName         string
	appUpdateKind         string
	appUpdateDescription  string
	appUpdateRescanWindow int
	appUpdateEndpointURL  string
	appUpdateActive       bool
	appUpdateInactive     bool
)

var applicationUpdateCmd = &cobra.Command{
	Use:   "update <app_0x...>",
	Short: "Update a scan-event application",
	Long: "Update name, description, kind, config, or active state. The pass\n" +
		"template binding is immutable. Switching to validate or forward\n" +
		"requires the matching entitlement.",
	Args: cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := clientFromContext(cmd.Context())
		if err != nil {
			return err
		}

		var in api.UpdateApplicationInput
		if cmd.Flags().Changed("name") {
			in.Name = &appUpdateName
		}
		if cmd.Flags().Changed("description") {
			in.Description = &appUpdateDescription
		}
		if cmd.Flags().Changed("kind") {
			in.Kind = &appUpdateKind
		}
		cfg := map[string]any{}
		if cmd.Flags().Changed("rescan-window") {
			cfg["rescanWindowSeconds"] = appUpdateRescanWindow
		}
		if cmd.Flags().Changed("endpoint-url") {
			cfg["endpointUrl"] = appUpdateEndpointURL
		}
		if len(cfg) > 0 {
			in.Config = cfg
		}
		// --active / --inactive are the two halves of one tri-state: unset
		// leaves the flag alone server-side.
		switch {
		case cmd.Flags().Changed("active"):
			v := appUpdateActive
			in.Active = &v
		case cmd.Flags().Changed("inactive"):
			v := !appUpdateInactive
			in.Active = &v
		}

		app, err := client.UpdateApplication(cmd.Context(), args[0], in)
		if err != nil {
			return err
		}
		if output.CurrentMode() == output.ModeJSON {
			return output.PrintJSON(app)
		}
		output.ApplicationDetailTable(app)
		return nil
	},
}

func init() {
	applicationUpdateCmd.Flags().StringVar(&appUpdateName, "name", "", "New application name")
	applicationUpdateCmd.Flags().StringVar(&appUpdateDescription, "description", "", "New description")
	applicationUpdateCmd.Flags().StringVar(&appUpdateKind, "kind", "", "log | validate | forward")
	applicationUpdateCmd.Flags().IntVar(&appUpdateRescanWindow, "rescan-window", 0, "Seconds before the same pass may scan again (0 clears)")
	applicationUpdateCmd.Flags().StringVar(&appUpdateEndpointURL, "endpoint-url", "", "https endpoint for kind forward")
	applicationUpdateCmd.Flags().BoolVar(&appUpdateActive, "active", true, "Mark the application active")
	applicationUpdateCmd.Flags().BoolVar(&appUpdateInactive, "inactive", true, "Mark the application inactive")
	applicationCmd.AddCommand(applicationUpdateCmd)
}
