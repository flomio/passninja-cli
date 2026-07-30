package cmd

import (
	"fmt"

	"github.com/flomio/passninja-cli/pkg/api"
	"github.com/flomio/passninja-cli/pkg/output"
	"github.com/flomio/passninja-cli/pkg/utils"
	"github.com/spf13/cobra"
)

var (
	appCreateName         string
	appCreateKind         string
	appCreatePassTemplate string
	appCreateDescription  string
	appCreateRescanWindow int
	appCreateEndpointURL  string
)

var applicationCreateCmd = &cobra.Command{
	Use:   "create",
	Short: "Create a scan-event application bound to one pass template",
	Long: "Create an application. The pass template binding is fixed once\n" +
		"created — make a new application to target a different template.\n\n" +
		"Kinds: log (base entitlement), validate (scan-events-validate), and\n" +
		"forward (scan-events-forward, requires --endpoint-url).",
	RunE: func(cmd *cobra.Command, _ []string) error {
		if appCreateName == "" || appCreatePassTemplate == "" {
			return fmt.Errorf("--name and --pass-template are required")
		}
		if appCreateKind != "log" && appCreateKind != "validate" && appCreateKind != "forward" {
			return fmt.Errorf("--kind must be one of: log, validate, forward")
		}
		if appCreateKind == "forward" && appCreateEndpointURL == "" {
			return fmt.Errorf("--endpoint-url is required for --kind forward")
		}
		client, err := clientFromContext(cmd.Context())
		if err != nil {
			return err
		}
		ptID, err := utils.NormalizePassTemplateID(appCreatePassTemplate)
		if err != nil {
			return err
		}

		in := api.CreateApplicationInput{
			Name:         appCreateName,
			Kind:         appCreateKind,
			PassTemplate: ptID,
			Description:  appCreateDescription,
		}
		cfg := map[string]any{}
		if appCreateRescanWindow > 0 {
			cfg["rescanWindowSeconds"] = appCreateRescanWindow
		}
		if appCreateEndpointURL != "" {
			cfg["endpointUrl"] = appCreateEndpointURL
		}
		if len(cfg) > 0 {
			in.Config = cfg
		}

		app, err := client.CreateApplication(cmd.Context(), in)
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
	applicationCreateCmd.Flags().StringVar(&appCreateName, "name", "", "Application name (required)")
	applicationCreateCmd.Flags().StringVar(&appCreateKind, "kind", "log", "log | validate | forward")
	applicationCreateCmd.Flags().StringVar(&appCreatePassTemplate, "pass-template", "", "ptk_0x... this application validates for (required)")
	applicationCreateCmd.Flags().StringVar(&appCreateDescription, "description", "", "Optional description")
	applicationCreateCmd.Flags().IntVar(&appCreateRescanWindow, "rescan-window", 0, "Seconds before the same pass may scan again (0 = no dedup)")
	applicationCreateCmd.Flags().StringVar(&appCreateEndpointURL, "endpoint-url", "", "https endpoint for --kind forward")
	applicationCmd.AddCommand(applicationCreateCmd)
}
