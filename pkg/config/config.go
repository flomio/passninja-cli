// Package config bootstraps Viper for the CLI. The session-wide defaults
// live in ~/.passninja.yaml; per-invocation overrides come from env
// variables (PASSNINJA_*) and persistent flags wired in cmd/root.go.
package config

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/spf13/viper"
)

const (
	defaultConfigName = ".passninja"
	envPrefix         = "PASSNINJA"
)

// Setup loads ~/.passninja.yaml if present and registers env-var binding for
// PASSNINJA_*. A non-existent config file is not an error.
func Setup(configPath string) error {
	if configPath != "" {
		viper.SetConfigFile(configPath)
	} else {
		home, err := os.UserHomeDir()
		if err != nil {
			return fmt.Errorf("locate home directory: %w", err)
		}
		viper.SetConfigName(defaultConfigName)
		viper.SetConfigType("yaml")
		viper.AddConfigPath(home)
		viper.AddConfigPath(filepath.Join(home, ".config", "passninja"))
	}

	viper.SetEnvPrefix(envPrefix)
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_", "-", "_"))
	viper.AutomaticEnv()

	// SensibleDefaults — overridden by yaml / env / flags.
	viper.SetDefault("default_output", "table")
	viper.SetDefault("debug", false)

	if err := viper.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			return fmt.Errorf("read config: %w", err)
		}
	}
	return nil
}
