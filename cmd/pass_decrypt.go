package cmd

import (
	"fmt"
	"io"
	"os"
	"strings"

	"github.com/flomio/passninja-cli/pkg/output"
	"github.com/flomio/passninja-cli/pkg/utils"
	"github.com/spf13/cobra"
)

var (
	decryptPayload     string
	decryptPayloadFile string
	decryptPlatform    string
)

var passDecryptCmd = &cobra.Command{
	Use:   "decrypt <ptk_0x...>",
	Short: "Decrypt a reader-issued payload against a template",
	Long: "Decrypt a payload captured by an NFC reader.\n\n" +
		"Apple VAS (the default) decrypts from the payload alone. Google Smart\n" +
		"Tap is session-bound — it also needs the ephemeral keys and nonces from\n" +
		"the tap itself, which only the reader holds, so run\n" +
		"`passninja reader serve` on the reader host for Google taps.",
	Args: cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		if decryptPlatform == "google" {
			return fmt.Errorf(
				"google Smart Tap decryption is session-bound and cannot be done from a captured payload alone; run `passninja reader serve` on the reader host")
		}
		client, err := clientFromContext(cmd.Context())
		if err != nil {
			return err
		}
		id, err := utils.NormalizePassTemplateID(args[0])
		if err != nil {
			return err
		}
		payload, err := readPayload()
		if err != nil {
			return err
		}
		out, err := client.DecryptPass(cmd.Context(), id, payload, decryptPlatform, nil)
		if err != nil {
			return err
		}
		return output.PrintJSON(out)
	},
}

func init() {
	passDecryptCmd.Flags().StringVar(&decryptPayload, "payload", "", "hex-encoded reader payload (or - to read stdin)")
	passDecryptCmd.Flags().StringVar(&decryptPayloadFile, "payload-file", "", "path to a file containing the payload")
	passDecryptCmd.Flags().StringVar(&decryptPlatform, "platform", "", "apple (default) or google")
	passCmd.AddCommand(passDecryptCmd)
}

func readPayload() (string, error) {
	switch {
	case decryptPayload == "-":
		b, err := io.ReadAll(os.Stdin)
		if err != nil {
			return "", fmt.Errorf("read stdin: %w", err)
		}
		return strings.TrimSpace(string(b)), nil
	case decryptPayload != "":
		return decryptPayload, nil
	case decryptPayloadFile != "":
		b, err := os.ReadFile(decryptPayloadFile)
		if err != nil {
			return "", fmt.Errorf("read %s: %w", decryptPayloadFile, err)
		}
		return strings.TrimSpace(string(b)), nil
	default:
		// No flag — read stdin if it's piped.
		b, err := io.ReadAll(os.Stdin)
		if err != nil {
			return "", fmt.Errorf("read stdin: %w", err)
		}
		s := strings.TrimSpace(string(b))
		if s == "" {
			return "", fmt.Errorf("payload is required: pass --payload, --payload-file, or pipe via stdin")
		}
		return s, nil
	}
}
