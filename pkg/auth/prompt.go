package auth

import (
	"bufio"
	"fmt"
	"io"
	"os"
	"strings"

	"golang.org/x/term"
)

// PromptOptions controls the interactive flow. Anything pre-set is used as
// the default; the user is prompted only for missing fields.
type PromptOptions struct {
	APIKey    string
	AccountID string
	BaseURL   string
	Out       io.Writer
	In        io.Reader
}

// Prompt walks the user through filling in missing credential fields. The
// API key is read with terminal echo disabled when stdin is a TTY.
func Prompt(opts PromptOptions) (Credentials, error) {
	if opts.Out == nil {
		opts.Out = os.Stdout
	}
	if opts.In == nil {
		opts.In = os.Stdin
	}
	r := bufio.NewReader(opts.In)

	c := Credentials{
		APIKey:    opts.APIKey,
		AccountID: opts.AccountID,
		BaseURL:   opts.BaseURL,
	}

	if c.AccountID == "" {
		fmt.Fprint(opts.Out, "Account ID (aid_0x...): ")
		line, err := r.ReadString('\n')
		if err != nil && err != io.EOF {
			return c, fmt.Errorf("read account id: %w", err)
		}
		c.AccountID = strings.TrimSpace(line)
	}

	if c.APIKey == "" {
		key, err := readSecret(opts.Out, "API key: ")
		if err != nil {
			return c, err
		}
		c.APIKey = key
	}

	if c.AccountID == "" || c.APIKey == "" {
		return c, fmt.Errorf("account id and api key are required")
	}
	return c, nil
}

func readSecret(out io.Writer, prompt string) (string, error) {
	fmt.Fprint(out, prompt)
	fd := int(os.Stdin.Fd())
	if term.IsTerminal(fd) {
		b, err := term.ReadPassword(fd)
		fmt.Fprintln(out) // newline after the (silent) input
		if err != nil {
			return "", fmt.Errorf("read api key: %w", err)
		}
		return strings.TrimSpace(string(b)), nil
	}
	// Non-TTY (CI, piped input) — just read a line normally.
	r := bufio.NewReader(os.Stdin)
	line, err := r.ReadString('\n')
	if err != nil && err != io.EOF {
		return "", fmt.Errorf("read api key: %w", err)
	}
	return strings.TrimSpace(line), nil
}
