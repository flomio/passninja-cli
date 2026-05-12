package utils

import (
	"encoding/json"
	"fmt"
	"io"
	"os"
	"strings"
)

// ParseFieldFlags merges `--field k=v` flags + an optional `--data '<json>'`
// (or `--data @file.json`, or `--data -` for stdin) into a single map.
// `--field` wins over `--data` on key conflicts so callers can layer
// overrides on top of a file.
func ParseFieldFlags(fields []string, dataFlag string) (map[string]any, error) {
	out := map[string]any{}

	if dataFlag != "" {
		raw, err := readDataFlag(dataFlag)
		if err != nil {
			return nil, err
		}
		if len(raw) > 0 {
			if err := json.Unmarshal(raw, &out); err != nil {
				return nil, fmt.Errorf("--data must be a JSON object: %w", err)
			}
		}
	}

	for _, f := range fields {
		k, v, ok := strings.Cut(f, "=")
		if !ok {
			return nil, fmt.Errorf("--field expects k=v (got %q)", f)
		}
		k = strings.TrimSpace(k)
		if k == "" {
			return nil, fmt.Errorf("--field key is empty in %q", f)
		}
		out[k] = v
	}

	return out, nil
}

func readDataFlag(v string) ([]byte, error) {
	switch {
	case strings.HasPrefix(v, "@"):
		path := v[1:]
		b, err := os.ReadFile(path)
		if err != nil {
			return nil, fmt.Errorf("--data file %s: %w", path, err)
		}
		return b, nil
	case v == "-":
		b, err := io.ReadAll(os.Stdin)
		if err != nil {
			return nil, fmt.Errorf("--data stdin: %w", err)
		}
		return b, nil
	default:
		return []byte(v), nil
	}
}

// ConfirmYes prints a y/n prompt to stderr (so it can't pollute stdout JSON
// streams) and returns true on a y/yes answer. If `yesFlag` is true, returns
// true without asking — used by `--yes` to skip the confirmation.
func ConfirmYes(prompt string, yesFlag bool) (bool, error) {
	if yesFlag {
		return true, nil
	}
	fmt.Fprintf(os.Stderr, "%s [y/N]: ", prompt)
	var line string
	if _, err := fmt.Fscanln(os.Stdin, &line); err != nil {
		// EOF or empty input = no
		return false, nil
	}
	switch strings.ToLower(strings.TrimSpace(line)) {
	case "y", "yes":
		return true, nil
	}
	return false, nil
}
