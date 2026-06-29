package cmd

import (
	"github.com/flomio/passninja-cli/pkg/api"
	"github.com/spf13/cobra"
	"github.com/spf13/pflag"
)

// addConfigGroupFlags registers the install-constraint / disable-sharing /
// auto top-up flags shared by `pass-template create` and `pass-template
// update`. Bool flags are tri-state via FlagSet.Changed — absent means "leave
// unchanged", not false. No package-level target vars: values are read back by
// name in configGroupsFromFlags.
func addConfigGroupFlags(f *pflag.FlagSet) {
	f.Bool("constrain-device", false, "limit installs to one device (requires install-constraints)")
	f.Bool("constrain-browser", false, "limit installs to one browser (requires install-constraints)")
	f.Bool("constrain-ip", false, "limit installs to one IP (requires install-constraints)")
	f.Bool("disable-apple-sharing", false, "disable Apple pass sharing (requires disable-sharing)")
	f.Bool("disable-google-sharing", false, "disable Google pass sharing (requires disable-sharing)")
	f.Bool("auto-recharge", false, "enable/disable auto top-up (per-template subscribers only)")
	f.String("balance-trigger", "", "auto top-up when balance falls below this ($10–$2000)")
	f.String("top-up-target", "", "auto top-up to this amount ($20–$4000)")
}

// configGroupsFromFlags reads the shared config-group flags off cmd and returns
// the populated groups (nil when the caller passed none) plus whether anything
// was set. Only flags the caller actually passed are included.
func configGroupsFromFlags(cmd *cobra.Command) (*api.InstallConstraints, *api.DisableSharing, *api.TopUp, bool) {
	changed := false
	f := cmd.Flags()
	boolPtr := func(name string) *bool {
		if !f.Changed(name) {
			return nil
		}
		v, _ := f.GetBool(name)
		changed = true
		return &v
	}
	strPtr := func(name string) *string {
		if !f.Changed(name) {
			return nil
		}
		v, _ := f.GetString(name)
		changed = true
		return &v
	}

	var ic *api.InstallConstraints
	if d, b, i := boolPtr("constrain-device"), boolPtr("constrain-browser"), boolPtr("constrain-ip"); d != nil || b != nil || i != nil {
		ic = &api.InstallConstraints{Device: d, Browser: b, IP: i}
	}
	var ds *api.DisableSharing
	if a, g := boolPtr("disable-apple-sharing"), boolPtr("disable-google-sharing"); a != nil || g != nil {
		ds = &api.DisableSharing{Apple: a, Google: g}
	}
	var tu *api.TopUp
	if ar, bt, tt := boolPtr("auto-recharge"), strPtr("balance-trigger"), strPtr("top-up-target"); ar != nil || bt != nil || tt != nil {
		tu = &api.TopUp{AutoRecharge: ar, BalanceTrigger: bt, TopUpTarget: tt}
	}
	return ic, ds, tu, changed
}
