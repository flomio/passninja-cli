package nfc

import (
	"crypto/sha256"
	"errors"
	"fmt"
)

// SelectOSE is the SELECT for the universal VAS applet "OSE.VAS.01", shared
// by Apple VAS and Google Smart Tap. The response's tag 0x50 names the wallet
// implementation: "ApplePay" or "AndroidPay".
var SelectOSE = []byte{
	0x00, 0xA4, 0x04, 0x00, 0x0A,
	'O', 'S', 'E', '.', 'V', 'A', 'S', '.', '0', '1',
	0x00,
}

// Status words shared by both flows.
const (
	SWOK         = 0x9000
	SWMoreData   = 0x9100
	SWNoPasses   = 0x9001
	SWChoosePass = 0x9302
)

// WalletName extracts the wallet implementation name (tag 0x50) from a
// SELECT OSE response body.
func WalletName(selectResp []byte) string {
	return string(TLVFind(selectResp, 0x50))
}

// BuildGetVASData builds the Apple VAS GET VAS DATA APDU for one merchant:
// 9F22 protocol version 0100, 9F25 SHA-256 of the pass type identifier,
// 9F28 nonce, 9F26 capabilities mask.
func BuildGetVASData(merchantID string) []byte {
	hash := sha256.Sum256([]byte(merchantID))
	body := []byte{0x9F, 0x22, 0x02, 0x01, 0x00, 0x9F, 0x25, 0x20}
	body = append(body, hash[:]...)
	body = append(body, 0x9F, 0x28, 0x04, 0xC5, 0x26, 0x6B, 0x6E)
	body = append(body, 0x9F, 0x26, 0x04, 0x00, 0x00, 0x00, 0x02)
	apdu := []byte{0x80, 0xCA, 0x01, 0x01, byte(len(body))}
	return append(apdu, body...)
}

// ExtractCryptogram pulls the VAS cryptogram (tag 9F27) from a GET VAS DATA
// response body. The cryptogram is the value POST /scans decrypts server-side:
// 4-byte device key id ‖ 32-byte ephemeral X coordinate ‖ ciphertext.
func ExtractCryptogram(resp []byte) ([]byte, error) {
	c := TLVFind(resp, 0x9F27)
	if c == nil && len(resp) > 8 {
		// Some firmware returns the template without nesting the tag where
		// expected; fall back to skipping the 8-byte header.
		c = resp[8:]
	}
	if len(c) < 37 {
		return nil, fmt.Errorf("vas: cryptogram too short (%d bytes)", len(c))
	}
	return c, nil
}

// ErrNotWallet distinguishes a non-wallet card (plain NFC tag) from protocol
// failures.
var ErrNotWallet = errors.New("nfc: not a wallet device")
