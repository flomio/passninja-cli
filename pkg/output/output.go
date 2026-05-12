// Package output formats command results in one of three modes:
// table (default), json, or plaintext (tab-separated, no decoration).
// Errors and status notices go to stderr; payloads go to stdout — so callers
// can pipe `passninja … --json` directly into jq.
package output

import (
	"encoding/json"
	"fmt"
	"io"
	"os"
	"strings"

	"github.com/fatih/color"
	"github.com/olekukonko/tablewriter"
)

type Mode int

const (
	ModeTable Mode = iota
	ModeJSON
	ModePlaintext
)

var (
	mode               = ModeTable
	stdoutW  io.Writer = os.Stdout
	stderrW  io.Writer = os.Stderr
	useColor           = false
)

// SetMode forces the output mode. cmd/root.go calls this from
// PersistentPreRunE after resolving --json / --plaintext / yaml defaults.
func SetMode(m Mode) { mode = m }

// CurrentMode returns the active mode — useful for the few callers (e.g.
// `webhook create`, which prints a "save this once" hint) that branch on it.
func CurrentMode() Mode { return mode }

// SetStdout / SetStderr let tests redirect.
func SetStdout(w io.Writer) { stdoutW = w }
func SetStderr(w io.Writer) { stderrW = w }

// EnableColor toggles colored Error/Success/Info/Warn output. The fatih/color
// package gates per-call based on the OS / terminal, but we also let callers
// force-disable via this flag for non-TTY targets.
func EnableColor(b bool) {
	useColor = b
	if !b {
		color.NoColor = true
	}
}

// Resolve picks a Mode from --json, --plaintext, and the yaml default key.
// --json wins over --plaintext if both are set.
func Resolve(jsonFlag, plaintextFlag bool, configDefault string) Mode {
	switch {
	case jsonFlag:
		return ModeJSON
	case plaintextFlag:
		return ModePlaintext
	}
	switch strings.ToLower(strings.TrimSpace(configDefault)) {
	case "json":
		return ModeJSON
	case "plaintext", "plain":
		return ModePlaintext
	default:
		return ModeTable
	}
}

// PrintJSON 2-space pretty-prints `v` to stdout.
func PrintJSON(v any) error {
	enc := json.NewEncoder(stdoutW)
	enc.SetIndent("", "  ")
	enc.SetEscapeHTML(false)
	return enc.Encode(v)
}

// PrintTable renders an ASCII table in table mode, falls back to tab-separated
// rows in plaintext mode, and renders nothing in json mode (json callers print
// the underlying object via PrintJSON instead).
func PrintTable(headers []string, rows [][]string) {
	switch mode {
	case ModeJSON:
		return // caller is responsible for PrintJSON
	case ModePlaintext:
		// tab-separated; no header decoration so output is awk-friendly
		fmt.Fprintln(stdoutW, strings.Join(headers, "\t"))
		for _, row := range rows {
			fmt.Fprintln(stdoutW, strings.Join(row, "\t"))
		}
	default:
		w := tablewriter.NewWriter(stdoutW)
		w.SetHeader(headers)
		w.SetAutoFormatHeaders(false)
		w.SetAutoWrapText(false)
		w.SetBorder(true)
		w.AppendBulk(rows)
		w.Render()
	}
}

// Print is a JSON-only helper: prints v as JSON if mode is JSON, otherwise
// is a no-op. Useful when a single-object response is being shown and the
// table formatting is implemented separately.
func Print(v any) {
	if mode == ModeJSON {
		_ = PrintJSON(v)
	}
}

// Error / Success / Info / Warn go to stderr (Error/Warn) or stdout (Success/
// Info). Colors are applied via fatih/color which itself guards on
// color.NoColor / TERM.
func Error(format string, args ...any) {
	out := color.New(color.FgRed, color.Bold).SprintfFunc()
	fmt.Fprintln(stderrW, out(format, args...))
}

func Warn(format string, args ...any) {
	out := color.New(color.FgYellow).SprintfFunc()
	fmt.Fprintln(stderrW, out(format, args...))
}

func Success(format string, args ...any) {
	out := color.New(color.FgGreen).SprintfFunc()
	fmt.Fprintln(stdoutW, out(format, args...))
}

func Info(format string, args ...any) {
	fmt.Fprintln(stdoutW, fmt.Sprintf(format, args...))
}
