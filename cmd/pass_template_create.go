package cmd

import (
	"fmt"

	"github.com/flomio/passninja-cli/pkg/api"
	"github.com/flomio/passninja-cli/pkg/output"
	"github.com/spf13/cobra"
)

var (
	ptCreateName     string
	ptCreatePlatform string
	ptCreateStyle    string
)

var passTemplateCreateCmd = &cobra.Command{
	Use:   "create",
	Short: "Provision a new pass template (enterprise only)",
	RunE: func(cmd *cobra.Command, _ []string) error {
		if ptCreateName == "" || ptCreatePlatform == "" || ptCreateStyle == "" {
			return fmt.Errorf("--name, --platform, and --style are all required")
		}
		client, err := clientFromContext(cmd.Context())
		if err != nil {
			return err
		}
		ic, ds, tu, _ := configGroupsFromFlags(cmd)
		pt, err := client.CreatePassTemplate(cmd.Context(), api.CreatePassTemplateInput{
			Name:               ptCreateName,
			Platform:           ptCreatePlatform,
			Style:              ptCreateStyle,
			InstallConstraints: ic,
			DisableSharing:     ds,
			TopUp:              tu,
		})
		if err != nil {
			return err
		}
		if output.CurrentMode() == output.ModeJSON {
			return output.PrintJSON(pt)
		}
		output.Success("Created %s", pt.ID)
		output.PassTemplateTable([]api.PassTemplate{*pt})
		return nil
	},
}

func init() {
	passTemplateCreateCmd.Flags().StringVar(&ptCreateName, "name", "", "Pass template name (required)")
	passTemplateCreateCmd.Flags().StringVar(&ptCreatePlatform, "platform", "", "apple | google (required)")
	passTemplateCreateCmd.Flags().StringVar(&ptCreateStyle, "style", "", "ticket | coupon | loyalty | access_control (required)")
	addConfigGroupFlags(passTemplateCreateCmd.Flags())
	passTemplateCmd.AddCommand(passTemplateCreateCmd)
}
