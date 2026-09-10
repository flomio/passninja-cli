package nfc

import (
	"encoding/binary"
	"errors"
	"fmt"
)

// SelectSmartTap selects the Smart Tap 2 applet (AID A000000476D0000111).
// Used as a fallback when the OSE select did not return the mobile nonce.
var SelectSmartTap = []byte{
	0x00, 0xA4, 0x04, 0x00, 0x09,
	0xA0, 0x00, 0x00, 0x04, 0x76, 0xD0, 0x00, 0x01, 0x11,
	0x00,
}

// GetMoreData continues a GET DATA response that ended with SW 9100.
var GetMoreData = []byte{0x90, 0xC0, 0x00, 0x00, 0x00}

// smartTapStatus names the status byte carried in a ses record.
var smartTapStatus = map[byte]string{
	0x00: "UNKNOWN", 0x01: "OK", 0x02: "NDEF_FORMAT_INVALID",
	0x03: "UNSUPPORTED_VERSION", 0x04: "INVALID_SEQUENCE_NUMBER",
	0x05: "UNKNOWN_MERCHANT", 0x06: "MERCHANT_INFO_MISSING",
	0x07: "SERVICE_DATA_MISSING", 0x08: "RESEND_REQUEST",
	0x09: "DATA_NOT_AVAILABLE_YET",
}

// MobileNonceFromOSE extracts the 32-byte mobile device nonce from a SELECT
// OSE response (tag 0xC2, present on newer wallet versions). Nil when absent.
func MobileNonceFromOSE(selectResp []byte) []byte {
	n := TLVFind(selectResp, 0xC2)
	if len(n) != 32 {
		return nil
	}
	return n
}

// MobileNonceFromSmartTapSelect extracts the mobile nonce from a SELECT
// Smart Tap applet response: 2-byte min version, 2-byte max version, then an
// NDEF message holding an "mdn" record (format flag + 32-byte nonce).
func MobileNonceFromSmartTapSelect(resp []byte) ([]byte, error) {
	if len(resp) < 5 {
		return nil, errors.New("smarttap: select response too short")
	}
	records, err := NdefParse(resp[4:])
	if err != nil {
		return nil, fmt.Errorf("smarttap: select response NDEF: %w", err)
	}
	mdn := NdefFind(records, "mdn")
	if mdn == nil || len(mdn.Payload) < 33 {
		return nil, errors.New("smarttap: no mdn nonce in select response")
	}
	return mdn.Payload[1:33], nil
}

// NegotiateParams is the session material a NEGOTIATE SECURE CHANNEL command
// carries. TerminalNonce, TerminalEphemeralPublicKey (33-byte compressed
// point), and Signature (DER ECDSA) come from the server's presign; the
// SessionID is minted by the reader host per tap.
type NegotiateParams struct {
	SessionID                  [8]byte
	CollectorID                uint32
	KeyVersion                 uint32
	TerminalNonce              []byte
	TerminalEphemeralPublicKey []byte
	Signature                  []byte
}

// BuildNegotiate builds the NEGOTIATE SECURE CHANNEL APDU (90 53). Layout per
// Smart Tap 2.1: an ngr record wrapping version 0x0001 plus nested ses and
// cpr records; cpr carries nonce ‖ auth flag ‖ ephemeral key ‖ key version ‖
// nested sig+cld records.
func BuildNegotiate(p NegotiateParams) ([]byte, error) {
	if len(p.TerminalNonce) != 32 {
		return nil, errors.New("smarttap: terminal nonce must be 32 bytes")
	}
	if len(p.TerminalEphemeralPublicKey) != 33 {
		return nil, errors.New("smarttap: terminal ephemeral key must be a 33-byte compressed point")
	}
	if len(p.Signature) == 0 {
		return nil, errors.New("smarttap: signature required")
	}

	var collector [4]byte
	binary.BigEndian.PutUint32(collector[:], p.CollectorID)
	var keyVersion [4]byte
	binary.BigEndian.PutUint32(keyVersion[:], p.KeyVersion)

	sigCld := NdefBuild([]NdefRecord{
		external("sig", append([]byte{0x04}, p.Signature...)),
		external("cld", append([]byte{0x04}, collector[:]...)),
	})

	cpr := make([]byte, 0, 70+len(sigCld))
	cpr = append(cpr, p.TerminalNonce...)
	cpr = append(cpr, 0x01) // live auth
	cpr = append(cpr, p.TerminalEphemeralPublicKey...)
	cpr = append(cpr, keyVersion[:]...)
	cpr = append(cpr, sigCld...)

	ses := append(append([]byte{}, p.SessionID[:]...), 0x00 /* sequence */, 0x01 /* OK */)
	ngr := append([]byte{0x00, 0x01}, NdefBuild([]NdefRecord{
		external("ses", ses),
		external("cpr", cpr),
	})...)
	data := NdefBuild([]NdefRecord{external("ngr", ngr)})

	apdu := []byte{0x90, 0x53, 0x00, 0x00, byte(len(data))}
	apdu = append(apdu, data...)
	return append(apdu, 0x00), nil
}

// ParseNegotiateResponse returns the mobile ephemeral public key (33-byte
// compressed point) from an nrs response, verifying the ses status is OK.
func ParseNegotiateResponse(resp []byte) ([]byte, error) {
	records, err := NdefParse(resp)
	if err != nil {
		return nil, fmt.Errorf("smarttap: negotiate response: %w", err)
	}
	nrs := NdefFind(records, "nrs")
	if nrs == nil {
		return nil, errors.New("smarttap: negotiate response has no nrs record")
	}
	inner, err := NdefParse(nrs.Payload)
	if err != nil {
		return nil, fmt.Errorf("smarttap: nrs payload: %w", err)
	}
	if ses := NdefFind(inner, "ses"); ses != nil && len(ses.Payload) >= 10 {
		if status := ses.Payload[9]; status != 0x01 {
			name := smartTapStatus[status]
			if name == "" {
				name = fmt.Sprintf("0x%02x", status)
			}
			return nil, fmt.Errorf("smarttap: negotiate rejected: %s", name)
		}
	}
	dpk := NdefFind(inner, "dpk")
	if dpk == nil || len(dpk.Payload) < 33 {
		return nil, errors.New("smarttap: negotiate response has no device ephemeral key")
	}
	return dpk.Payload[len(dpk.Payload)-33:], nil
}

// BuildGetData builds the GET DATA APDU (90 50): an srq record wrapping the
// session, the merchant (collector id), a service list requesting ALL object
// types, and the POS capabilities. ZLIB is deliberately NOT advertised so the
// device sends an uncompressed bundle — the server-side decrypt expects to
// parse the plaintext NDEF directly.
func BuildGetData(sessionID [8]byte, collectorID uint32) []byte {
	var collector [4]byte
	binary.BigEndian.PutUint32(collector[:], collectorID)

	ses := append(append([]byte{}, sessionID[:]...), 0x01 /* sequence */, 0x01 /* OK */)
	mer := NdefBuild([]NdefRecord{external("cld", append([]byte{0x04}, collector[:]...))})
	slr := NdefBuild([]NdefRecord{external("str", []byte{0x00})}) // ALL
	pcr := []byte{0x01, 0x00, 0x00, 0x00, 0x04}                   // standalone; tap pass+payment

	srq := append([]byte{0x00, 0x01}, NdefBuild([]NdefRecord{
		external("ses", ses),
		external("mer", mer),
		external("slr", slr),
		external("pcr", pcr),
	})...)
	data := NdefBuild([]NdefRecord{external("srq", srq)})

	apdu := []byte{0x90, 0x50, 0x00, 0x00, byte(len(data))}
	apdu = append(apdu, data...)
	return append(apdu, 0x00)
}

// ExtractEncryptedBundle pulls the encrypted record bundle out of a complete
// GET DATA response (srs → reb). The first payload byte is the response flag;
// bit 0 marks encryption, bit 1 zlib compression. The returned bytes are the
// IV ‖ ciphertext ‖ HMAC blob POST /scans decrypts.
func ExtractEncryptedBundle(resp []byte) ([]byte, error) {
	records, err := NdefParse(resp)
	if err != nil {
		return nil, fmt.Errorf("smarttap: get data response: %w", err)
	}
	srs := NdefFind(records, "srs")
	if srs == nil {
		return nil, errors.New("smarttap: get data response has no srs record")
	}
	inner, err := NdefParse(srs.Payload)
	if err != nil {
		return nil, fmt.Errorf("smarttap: srs payload: %w", err)
	}
	reb := NdefFind(inner, "reb")
	if reb == nil || len(reb.Payload) < 2 {
		return nil, errors.New("smarttap: get data response has no record bundle")
	}
	flag, body := reb.Payload[0], reb.Payload[1:]
	if flag&0x01 == 0 {
		return nil, fmt.Errorf("smarttap: bundle is not encrypted (flag 0x%02x)", flag)
	}
	if flag&0x02 != 0 {
		return nil, fmt.Errorf("smarttap: bundle is compressed (flag 0x%02x) despite ZLIB not being advertised", flag)
	}
	return body, nil
}
