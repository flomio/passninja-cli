// Package utils holds small helpers shared across commands.
package utils

import (
	"fmt"
	"strings"
)

// NormalizePassTemplateID accepts either "ptk_0x<hex>" or a bare numeric
// string and returns the canonical "ptk_0x<hex>" form. Plain numerics are
// converted to lowercase hex with no zero-padding — same convention as
// passninja-site's formatPassTemplateApiKey.
func NormalizePassTemplateID(raw string) (string, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return "", fmt.Errorf("pass template id is required")
	}
	if strings.HasPrefix(raw, "ptk_0x") {
		hex := raw[len("ptk_0x"):]
		if !isHex(hex) {
			return "", fmt.Errorf("invalid pass template id: %q", raw)
		}
		return "ptk_0x" + strings.ToLower(hex), nil
	}
	// Plain decimal — convert to hex.
	n := int64(0)
	for _, r := range raw {
		if r < '0' || r > '9' {
			return "", fmt.Errorf("invalid pass template id: %q (expected ptk_0x<hex> or decimal)", raw)
		}
		n = n*10 + int64(r-'0')
	}
	return fmt.Sprintf("ptk_0x%x", n), nil
}

// NormalizeAccountID accepts either aid_0x<hex> or a bare decimal and
// returns the canonical aid_0x<hex> form, zero-padded to at least 3 hex
// digits (matching formatAccountApiId on the server).
func NormalizeAccountID(raw string) (string, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return "", fmt.Errorf("account id is required")
	}
	if strings.HasPrefix(raw, "aid_0x") {
		hex := raw[len("aid_0x"):]
		if !isHex(hex) {
			return "", fmt.Errorf("invalid account id: %q", raw)
		}
		// Re-pad to keep one canonical form on the wire.
		if len(hex) < 3 {
			hex = strings.Repeat("0", 3-len(hex)) + hex
		}
		return "aid_0x" + strings.ToLower(hex), nil
	}
	n := int64(0)
	for _, r := range raw {
		if r < '0' || r > '9' {
			return "", fmt.Errorf("invalid account id: %q (expected aid_0x<hex> or decimal)", raw)
		}
		n = n*10 + int64(r-'0')
	}
	return fmt.Sprintf("aid_0x%03x", n), nil
}

func isHex(s string) bool {
	if s == "" {
		return false
	}
	for _, r := range s {
		if !((r >= '0' && r <= '9') || (r >= 'a' && r <= 'f') || (r >= 'A' && r <= 'F')) {
			return false
		}
	}
	return true
}
