package cmd

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/flomio/passninja-cli/pkg/api"
	"github.com/flomio/passninja-cli/pkg/output"
	"github.com/flomio/passninja-cli/pkg/utils"
	"github.com/spf13/cobra"
)

var (
	ptUpdateName     string
	ptUpdateSet      []string
	ptUpdateShow     []string
	ptUpdateHide     []string
	ptUpdateRequire  []string
	ptUpdateOptional []string
	ptUpdateRemap    []string
	ptUpdateData     string
	ptUpdateReplace  bool
)

var passTemplateUpdateCmd = &cobra.Command{
	Use:   "update <ptk_0x...>",
	Short: "Update a pass template (enterprise only; PATCH by default, --replace for PUT)",
	Long: `Update an existing pass template's name, scalar field settings, and its
install-constraint / disable-sharing / auto top-up configuration.

Field edits are addressed by api field name (see "pass-template required-fields"
or the Platform Parameters docs):
  --set    background.color="rgb(0, 0, 255)"   set a field's default value
  --remap  primary.value=guest.name           rename a field's api field name
  --show / --hide        <api_field_name>      toggle visibility
  --require / --optional <api_field_name>      toggle required

Use --data '<json>' (or @file.json / -) to send a raw request body instead.`,
	Args: cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := clientFromContext(cmd.Context())
		if err != nil {
			return err
		}
		id, err := utils.NormalizePassTemplateID(args[0])
		if err != nil {
			return err
		}

		var body any
		if ptUpdateData != "" {
			raw, err := utils.ReadRawData(ptUpdateData)
			if err != nil {
				return err
			}
			var m any
			if err := json.Unmarshal(raw, &m); err != nil {
				return fmt.Errorf("--data must be valid JSON: %w", err)
			}
			body = m
		} else {
			in, changed, err := buildPTUpdateInput(cmd)
			if err != nil {
				return err
			}
			if !changed {
				return fmt.Errorf("provide at least one change (--name, --set/--remap/--show/--hide/--require/--optional, a constraint/sharing/top-up flag, or --data)")
			}
			body = in
		}

		pt, err := client.UpdatePassTemplate(cmd.Context(), id, body, ptUpdateReplace)
		if err != nil {
			return err
		}
		if output.CurrentMode() == output.ModeJSON {
			return output.PrintJSON(pt)
		}
		output.Success("Updated %s", pt.ID)
		output.PassTemplateTable([]api.PassTemplate{*pt})
		return nil
	},
}

// buildPTUpdateInput assembles an UpdatePassTemplateInput from the flags and
// reports whether anything was actually set.
func buildPTUpdateInput(cmd *cobra.Command) (api.UpdatePassTemplateInput, bool, error) {
	in := api.UpdatePassTemplateInput{}
	changed := false

	if cmd.Flags().Changed("name") {
		v := ptUpdateName
		in.Name = &v
		changed = true
	}

	// Field edits, merged per api field name.
	fields := map[string]*api.FieldUpdate{}
	at := func(name string) *api.FieldUpdate {
		if fields[name] == nil {
			fields[name] = &api.FieldUpdate{}
		}
		return fields[name]
	}
	for _, kv := range ptUpdateSet {
		k, v, ok := strings.Cut(kv, "=")
		if !ok || strings.TrimSpace(k) == "" {
			return in, false, fmt.Errorf("--set expects api_field_name=value (got %q)", kv)
		}
		val := v
		at(strings.TrimSpace(k)).DefaultValue = &val
	}
	for _, kv := range ptUpdateRemap {
		k, v, ok := strings.Cut(kv, "=")
		if !ok || strings.TrimSpace(k) == "" || strings.TrimSpace(v) == "" {
			return in, false, fmt.Errorf("--remap expects old_api_field_name=new_api_field_name (got %q)", kv)
		}
		nv := strings.TrimSpace(v)
		at(strings.TrimSpace(k)).APIFieldName = &nv
	}
	for _, name := range ptUpdateShow {
		t := true
		at(name).Visible = &t
	}
	for _, name := range ptUpdateHide {
		f := false
		at(name).Visible = &f
	}
	for _, name := range ptUpdateRequire {
		t := true
		at(name).Required = &t
	}
	for _, name := range ptUpdateOptional {
		f := false
		at(name).Required = &f
	}
	if len(fields) > 0 {
		in.Fields = map[string]api.FieldUpdate{}
		for k, v := range fields {
			in.Fields[k] = *v
		}
		changed = true
	}

	// Install-constraint / disable-sharing / top-up groups (shared flags).
	ic, ds, tu, cfgChanged := configGroupsFromFlags(cmd)
	in.InstallConstraints, in.DisableSharing, in.TopUp = ic, ds, tu
	if cfgChanged {
		changed = true
	}

	return in, changed, nil
}

func init() {
	f := passTemplateUpdateCmd.Flags()
	f.StringVar(&ptUpdateName, "name", "", "new template name")
	f.StringArrayVar(&ptUpdateSet, "set", nil, "set a field default: api_field_name=value (repeatable)")
	f.StringArrayVar(&ptUpdateShow, "show", nil, "make a field visible: api_field_name (repeatable)")
	f.StringArrayVar(&ptUpdateHide, "hide", nil, "make a field hidden: api_field_name (repeatable)")
	f.StringArrayVar(&ptUpdateRequire, "require", nil, "mark a field required: api_field_name (repeatable)")
	f.StringArrayVar(&ptUpdateOptional, "optional", nil, "mark a field optional: api_field_name (repeatable)")
	f.StringArrayVar(&ptUpdateRemap, "remap", nil, "rename a field api key: old=new (repeatable)")
	addConfigGroupFlags(f)
	f.StringVar(&ptUpdateData, "data", "", "raw JSON body, @file.json, or - for stdin (overrides other flags)")
	f.BoolVar(&ptUpdateReplace, "replace", false, "use PUT (full replace) instead of PATCH")
	passTemplateCmd.AddCommand(passTemplateUpdateCmd)
}
