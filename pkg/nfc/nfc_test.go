package nfc

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"testing"
)

// Byte-exact example messages from the Smart Tap 2.1 protocol documentation
// (kormax/google-smart-tap). The same vectors validated the Python prototype
// that was field-verified against real iPhone and Pixel taps.
const (
	vecNegotiate = "d403b86e6772000194030a7365736b159a80fc8283fd00015403a0637072a8aa2bae1ba891783d8c5be8a95bf2f9e5bb90fd9d197f8b2b1a84d9cc80427501027b2e12f1a1a542084b4d01b8799380fa4cb77e530ba2305b0bf2b3e4b474fe7d0000000194034973696704304602210086e43dc483b22e51aa177ae8112ed83d399a58b41d6d8cbe900cde03c4524da5022100e94b6a919c9e097568f4efa9a7123b86b97ee44342593f8a77fc9e12e3f95ae4540305636c640401020304"
	vecGetData   = "d4033b737271000194030a7365736b159a80fc8283fd010114030b6d6572d40305636c640401020304140307736c72d40301737472005403057063724100000004"
	vecNegResp   = "d403376e727394030a7365736b159a80fc8283fd010154032164706b03dfee38dbdb68a607383ad622640b180cc7e27d796b4e788c40e5d994291c71fc"
	vecOSESelect = "6f8184500a416e64726f6964506179c0020001c108cc00000000008080c22056d2ec8f857f0049aa54f1ca1de2791b5693a7014e6e4565d5644b1c2a305136c32103dfee38dbdb68a607383ad622640b180cc7e27d796b4e788c40e5d994291c71fca523bf0c20611e4f09a000000476d0000111870101730edf6d020000df4d020001df620103"
	vecVASResp   = "70549f2a009f274ebeef7375094afa4824addb8abf0a59f4c5b88f7b33cd803666cdf358dc8aa2ecea863673b7e92b8f39bc744233dda87e53f2ae346eb43415e7b20a50aa41e02de9f3d533f506e29b4ed31eaa9cfa"
)

func fromHex(t *testing.T, s string) []byte {
	t.Helper()
	b, err := hex.DecodeString(s)
	if err != nil {
		t.Fatalf("bad hex fixture: %v", err)
	}
	return b
}

func TestNdefRoundTripsProtocolVectors(t *testing.T) {
	for name, vec := range map[string]string{
		"negotiate":          vecNegotiate,
		"get-data":           vecGetData,
		"negotiate-response": vecNegResp,
	} {
		raw := fromHex(t, vec)
		records, err := NdefParse(raw)
		if err != nil {
			t.Fatalf("%s: parse: %v", name, err)
		}
		rebuilt := NdefBuild(records)
		if !bytes.Equal(rebuilt, raw) {
			t.Errorf("%s: rebuild mismatch\n got %x\nwant %x", name, rebuilt, raw)
		}
	}
}

func TestWalletNameAndMobileNonceFromOSE(t *testing.T) {
	resp := fromHex(t, vecOSESelect)
	if got := WalletName(resp); got != "AndroidPay" {
		t.Errorf("WalletName = %q, want AndroidPay", got)
	}
	nonce := MobileNonceFromOSE(resp)
	want := "56d2ec8f857f0049aa54f1ca1de2791b5693a7014e6e4565d5644b1c2a305136"
	if hex.EncodeToString(nonce) != want {
		t.Errorf("MobileNonceFromOSE = %x, want %s", nonce, want)
	}
}

func TestExtractCryptogram(t *testing.T) {
	c, err := ExtractCryptogram(fromHex(t, vecVASResp))
	if err != nil {
		t.Fatalf("ExtractCryptogram: %v", err)
	}
	if len(c) != 0x4E {
		t.Errorf("cryptogram length = %d, want %d", len(c), 0x4E)
	}
	if c[0] != 0xBE || c[1] != 0xEF {
		t.Errorf("cryptogram prefix = %x, want beef…", c[:2])
	}
}

func TestBuildGetVASDataEmbedsMerchantHash(t *testing.T) {
	const merchant = "pass.com.passninja.rails.generic"
	apdu := BuildGetVASData(merchant)
	hash := sha256.Sum256([]byte(merchant))
	if !bytes.Contains(apdu, hash[:]) {
		t.Error("GET VAS DATA does not embed the merchant hash")
	}
	if apdu[0] != 0x80 || apdu[1] != 0xCA {
		t.Errorf("unexpected CLA/INS %x", apdu[:2])
	}
	if int(apdu[4]) != len(apdu)-5 {
		t.Errorf("Lc %d does not match body length %d", apdu[4], len(apdu)-5)
	}
}

// TestBuildNegotiateMatchesVector rebuilds the documented negotiate command
// from its own field values and requires byte equality — proving the record
// layout, flag bytes, and framing are exactly per spec.
func TestBuildNegotiateMatchesVector(t *testing.T) {
	raw := fromHex(t, vecNegotiate)

	var sessionID [8]byte
	copy(sessionID[:], fromHex(t, "6b159a80fc8283fd"))
	p := NegotiateParams{
		SessionID:                  sessionID,
		CollectorID:                0x01020304,
		KeyVersion:                 1,
		TerminalNonce:              fromHex(t, "a8aa2bae1ba891783d8c5be8a95bf2f9e5bb90fd9d197f8b2b1a84d9cc804275"),
		TerminalEphemeralPublicKey: fromHex(t, "027b2e12f1a1a542084b4d01b8799380fa4cb77e530ba2305b0bf2b3e4b474fe7d"),
		Signature:                  fromHex(t, "304602210086e43dc483b22e51aa177ae8112ed83d399a58b41d6d8cbe900cde03c4524da5022100e94b6a919c9e097568f4efa9a7123b86b97ee44342593f8a77fc9e12e3f95ae4"),
	}
	apdu, err := BuildNegotiate(p)
	if err != nil {
		t.Fatalf("BuildNegotiate: %v", err)
	}
	// APDU = 90 53 00 00 Lc ‖ data ‖ 00; the vector is the data portion.
	data := apdu[5 : len(apdu)-1]
	if !bytes.Equal(data, raw) {
		t.Errorf("negotiate data mismatch\n got %x\nwant %x", data, raw)
	}
}

// TestBuildGetDataMatchesVector rebuilds the documented get-data command.
// The vector advertises ZLIB (0x41); this host deliberately does not (0x01),
// so compare against the vector with that one capability byte rewritten.
func TestBuildGetDataMatchesVector(t *testing.T) {
	raw := fromHex(t, vecGetData)
	want := bytes.Replace(raw, []byte{0x70, 0x63, 0x72, 0x41}, []byte{0x70, 0x63, 0x72, 0x01}, 1)

	var sessionID [8]byte
	copy(sessionID[:], fromHex(t, "6b159a80fc8283fd"))
	apdu := BuildGetData(sessionID, 0x01020304)
	data := apdu[5 : len(apdu)-1]
	if !bytes.Equal(data, want) {
		t.Errorf("get-data mismatch\n got %x\nwant %x", data, want)
	}
}

func TestParseNegotiateResponse(t *testing.T) {
	dpk, err := ParseNegotiateResponse(fromHex(t, vecNegResp))
	if err != nil {
		t.Fatalf("ParseNegotiateResponse: %v", err)
	}
	want := "03dfee38dbdb68a607383ad622640b180cc7e27d796b4e788c40e5d994291c71fc"
	if hex.EncodeToString(dpk) != want {
		t.Errorf("device key = %x, want %s", dpk, want)
	}
}

func TestExtractEncryptedBundle(t *testing.T) {
	// Compose an srs → ses+reb response with an encrypted, uncompressed flag.
	body := []byte{0xAA, 0xBB, 0xCC}
	ses := append(fromHex(t, "6b159a80fc8283fd"), 0x02, 0x01)
	inner := NdefBuild([]NdefRecord{
		external("ses", ses),
		external("reb", append([]byte{0x01}, body...)),
	})
	resp := NdefBuild([]NdefRecord{external("srs", inner)})

	got, err := ExtractEncryptedBundle(resp)
	if err != nil {
		t.Fatalf("ExtractEncryptedBundle: %v", err)
	}
	if !bytes.Equal(got, body) {
		t.Errorf("bundle = %x, want %x", got, body)
	}

	// A compressed flag must be rejected — this host never advertises ZLIB.
	inner = NdefBuild([]NdefRecord{external("reb", append([]byte{0x03}, body...))})
	resp = NdefBuild([]NdefRecord{external("srs", inner)})
	if _, err := ExtractEncryptedBundle(resp); err == nil {
		t.Error("compressed bundle unexpectedly accepted")
	}
}
