//go:build windows || ((darwin || linux) && cgo)

// PC/SC transport for the reader host: drives an attached ACS WalletMate /
// WalletMate II (or any PC/SC contactless reader) directly, so no separate
// reader daemon is needed. Each tap runs the wallet-detection flow (SELECT
// OSE.VAS.01), captures the encrypted payload for the platform it finds, and
// submits it as a scan for server-side decryption — no key material is ever
// held on this host. The Google Smart Tap session is signed mid-tap by the
// pre-sign endpoint.

package reader

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/ebfe/scard"
	"github.com/flomio/passninja-cli/pkg/api"
	"github.com/flomio/passninja-cli/pkg/nfc"
)

const pcscAvailable = true

// googleTemplateParams is one bound Google template's polling identity.
type googleTemplateParams struct {
	id        string
	collector uint32
}

// ACS escape control code (PCSC_CTL_CODE 3500 on pcsc-lite; FILE_DEVICE_
// SMARTCARD form on Windows). Tried in order — used only for the optional
// polling-enable nudge, so a rejection is harmless.
var escapeCtlCodes = []uint32{0x42000000 + 3500, (0x0031 << 16) | (3500 << 2)}

// servePCSC owns the reader end-to-end: pick the contactless interface, make
// sure the RF field polls, then loop tap → capture → submit until ctx ends.
func servePCSC(ctx context.Context, client *api.Client, opts Options) error {
	cfg, err := client.GetReaderSelfConfig(ctx)
	if err != nil {
		return fmt.Errorf("fetching reader config (is the token valid and the reader bound to an application?): %w", err)
	}
	var appleMerchants []string
	var googleTemplates []googleTemplateParams
	for _, t := range cfg.Templates {
		if t.Apple != nil && t.Apple.VASMerchantID != "" {
			appleMerchants = append(appleMerchants, t.Apple.VASMerchantID)
		}
		if t.Google != nil && t.Google.SmartTapCollectorID != "" {
			id, err := strconv.ParseUint(t.Google.SmartTapCollectorID, 10, 32)
			if err != nil {
				fmt.Fprintf(opts.Status, "[passninja reader] skipping %s: bad collector id %q\n", t.ID, t.Google.SmartTapCollectorID)
				continue
			}
			googleTemplates = append(googleTemplates, googleTemplateParams{id: t.ID, collector: uint32(id)})
		}
	}
	if len(appleMerchants) == 0 && len(googleTemplates) == 0 {
		return errors.New("the reader's bound templates carry no Apple or Google reader parameters")
	}

	sctx, err := scard.EstablishContext()
	if err != nil {
		return fmt.Errorf("PC/SC unavailable: %w", err)
	}
	defer sctx.Release()

	picc, err := pickPICCReader(sctx, opts.PCSCReader)
	if err != nil {
		return err
	}
	fmt.Fprintf(opts.Status, "[passninja reader] PC/SC interface: %s\n", picc)
	fmt.Fprintf(opts.Status, "[passninja reader] polling for %d Apple merchant(s), %d Google template(s)\n",
		len(appleMerchants), len(googleTemplates))

	ensurePolling(sctx, picc, opts)

	for ctx.Err() == nil {
		present, err := waitForCard(ctx, sctx, picc)
		if err != nil {
			return err
		}
		if !present {
			continue
		}

		card, err := sctx.Connect(picc, scard.ShareShared, scard.ProtocolAny)
		if err != nil {
			// The phone left the field between detection and connect.
			continue
		}
		in, err := captureTap(ctx, client, card, appleMerchants, googleTemplates, opts)
		_ = card.Disconnect(scard.LeaveCard)
		if err != nil {
			fmt.Fprintf(opts.Status, "[passninja reader] tap failed: %v\n", err)
		} else if in != nil {
			handleScan(ctx, client, opts, *in)
		}
		waitForRemoval(ctx, sctx, picc)
	}
	fmt.Fprintf(opts.Status, "[passninja reader] shutting down\n")
	return nil
}

// pickPICCReader chooses the contactless interface. Dual-interface ACS
// readers expose a SAM slot whose card is permanently present; the empty
// interface is the PICC side.
func pickPICCReader(sctx *scard.Context, override string) (string, error) {
	readers, err := sctx.ListReaders()
	if err != nil || len(readers) == 0 {
		return "", fmt.Errorf("no PC/SC readers found — is the NFC reader plugged in? (%v)", err)
	}
	if override != "" {
		for _, r := range readers {
			if strings.Contains(r, override) {
				return r, nil
			}
		}
		return "", fmt.Errorf("no PC/SC reader matches %q (available: %s)", override, strings.Join(readers, ", "))
	}

	states := make([]scard.ReaderState, len(readers))
	for i, r := range readers {
		states[i] = scard.ReaderState{Reader: r, CurrentState: scard.StateUnaware}
	}
	if err := sctx.GetStatusChange(states, 0); err == nil {
		for i, s := range states {
			if s.EventState&scard.StatePresent == 0 {
				return readers[i], nil
			}
		}
	}
	return readers[0], nil
}

// ensurePolling nudges first-generation WalletMate readers, which ship with
// automatic PICC polling disabled in EEPROM, by reading the auto-poll
// parameter over the SAM interface and enabling it when off. Best-effort:
// escape commands need the vendor CCID driver, and WalletMate II polls by
// default, so every failure path is just logged.
func ensurePolling(sctx *scard.Context, picc string, opts Options) {
	readers, err := sctx.ListReaders()
	if err != nil {
		return
	}
	for _, r := range readers {
		if r == picc {
			continue
		}
		card, err := sctx.Connect(r, scard.ShareShared, scard.ProtocolAny)
		if err != nil {
			continue
		}
		for _, code := range escapeCtlCodes {
			resp, err := card.Control(code, []byte{0xE0, 0x00, 0x00, 0x23, 0x00})
			if err != nil || len(resp) == 0 {
				continue
			}
			if cur := resp[len(resp)-1]; cur&0x01 == 0 {
				if _, err := card.Control(code, []byte{0xE0, 0x00, 0x00, 0x23, 0x01, 0x8B}); err == nil {
					fmt.Fprintf(opts.Status, "[passninja reader] enabled automatic PICC polling (was 0x%02x)\n", cur)
				}
			}
			break
		}
		_ = card.Disconnect(scard.LeaveCard)
	}
}

// waitForCard blocks until a card (a phone) enters the field, polling in
// short slices so ctx cancellation is honored promptly.
func waitForCard(ctx context.Context, sctx *scard.Context, picc string) (bool, error) {
	states := []scard.ReaderState{{Reader: picc, CurrentState: scard.StateUnaware}}
	for ctx.Err() == nil {
		if err := sctx.GetStatusChange(states, time.Second); err != nil && err != scard.ErrTimeout {
			return false, fmt.Errorf("PC/SC status wait failed (reader unplugged?): %w", err)
		}
		if states[0].EventState&scard.StatePresent != 0 {
			return true, nil
		}
		states[0].CurrentState = states[0].EventState
	}
	return false, nil
}

// waitForRemoval waits (bounded) for the phone to leave the field so one
// physical tap produces one scan.
func waitForRemoval(ctx context.Context, sctx *scard.Context, picc string) {
	states := []scard.ReaderState{{Reader: picc, CurrentState: scard.StatePresent}}
	deadline := time.Now().Add(10 * time.Second)
	for ctx.Err() == nil && time.Now().Before(deadline) {
		if err := sctx.GetStatusChange(states, 500*time.Millisecond); err != nil && err != scard.ErrTimeout {
			return
		}
		if states[0].EventState&scard.StatePresent == 0 {
			return
		}
		states[0].CurrentState = states[0].EventState
	}
}

// transmit sends one APDU and splits the status word off the response.
func transmit(card *scard.Card, apdu []byte) ([]byte, uint16, error) {
	resp, err := card.Transmit(apdu)
	if err != nil {
		return nil, 0, err
	}
	if len(resp) < 2 {
		return nil, 0, fmt.Errorf("short response (%d bytes)", len(resp))
	}
	sw := uint16(resp[len(resp)-2])<<8 | uint16(resp[len(resp)-1])
	return resp[:len(resp)-2], sw, nil
}

// captureTap runs the wallet flow against a connected card and returns the
// scan to submit, or nil for a benign non-event (unknown pass, foreign card).
func captureTap(
	ctx context.Context,
	client *api.Client,
	card *scard.Card,
	appleMerchants []string,
	googleTemplates []googleTemplateParams,
	opts Options,
) (*api.ScanInput, error) {
	body, sw, err := transmit(card, nfc.SelectOSE)
	if err != nil {
		return nil, fmt.Errorf("SELECT OSE: %w", err)
	}
	if sw != nfc.SWOK {
		fmt.Fprintf(opts.Status, "[passninja reader] non-wallet card (SELECT SW %04x)\n", sw)
		return nil, nil
	}

	switch nfc.WalletName(body) {
	case "ApplePay":
		if len(appleMerchants) == 0 {
			return nil, errors.New("ApplePay device tapped but no bound template has Apple reader parameters")
		}
		return captureApple(card, appleMerchants, opts)
	case "AndroidPay":
		if len(googleTemplates) == 0 {
			return nil, errors.New("AndroidPay device tapped but no bound template has Google reader parameters")
		}
		return captureGoogle(ctx, client, card, body, googleTemplates, opts)
	default:
		fmt.Fprintf(opts.Status, "[passninja reader] unknown wallet implementation %q\n", nfc.WalletName(body))
		return nil, nil
	}
}

// captureApple runs GET VAS DATA per bound merchant until one yields a
// cryptogram, which is submitted raw for server-side decryption.
func captureApple(card *scard.Card, merchants []string, opts Options) (*api.ScanInput, error) {
	var lastSW uint16
	for _, merchant := range merchants {
		body, sw, err := transmit(card, nfc.BuildGetVASData(merchant))
		if err != nil {
			return nil, fmt.Errorf("GET VAS DATA: %w", err)
		}
		lastSW = sw
		if sw != nfc.SWOK {
			continue
		}
		cryptogram, err := nfc.ExtractCryptogram(body)
		if err != nil {
			return nil, err
		}
		return &api.ScanInput{
			ScanType: "nfc",
			Platform: "apple",
			Payload:  hex.EncodeToString(cryptogram),
		}, nil
	}
	return nil, fmt.Errorf("no bound merchant produced a VAS cryptogram (last SW %04x — is the pass installed and presented?)", lastSW)
}

// captureGoogle runs the Smart Tap 2.1 flow: capture the mobile nonce, have
// the server pre-sign the session mid-tap, negotiate the secure channel, and
// collect the encrypted bundle plus the session context /scans decrypts with.
func captureGoogle(
	ctx context.Context,
	client *api.Client,
	card *scard.Card,
	oseResp []byte,
	templates []googleTemplateParams,
	opts Options,
) (*api.ScanInput, error) {
	mobileNonce := nfc.MobileNonceFromOSE(oseResp)
	if mobileNonce == nil {
		body, sw, err := transmit(card, nfc.SelectSmartTap)
		if err != nil || sw != nfc.SWOK {
			return nil, fmt.Errorf("SELECT Smart Tap failed (SW %04x): %v", sw, err)
		}
		if mobileNonce, err = nfc.MobileNonceFromSmartTapSelect(body); err != nil {
			return nil, err
		}
	}

	var lastErr error
	for _, tpl := range templates {
		in, err := negotiateAndRead(ctx, client, card, tpl.id, tpl.collector, mobileNonce)
		if err == nil {
			return in, nil
		}
		lastErr = err
		fmt.Fprintf(opts.Status, "[passninja reader] %s: %v\n", tpl.id, err)
	}
	return nil, lastErr
}

func negotiateAndRead(
	ctx context.Context,
	client *api.Client,
	card *scard.Card,
	templateID string,
	collectorID uint32,
	mobileNonce []byte,
) (*api.ScanInput, error) {
	// The phone holds the field while this round trip runs; the pre-sign is
	// the price of never holding the collector key on this host.
	presign, err := client.PreSignSmartTap(ctx, templateID, hex.EncodeToString(mobileNonce))
	if err != nil {
		return nil, fmt.Errorf("presign: %w", err)
	}
	terminalNonce, err := hex.DecodeString(presign.TerminalNonce)
	if err != nil {
		return nil, fmt.Errorf("presign: bad terminal nonce: %w", err)
	}
	terminalEphPub, err := hex.DecodeString(presign.TerminalEphemeralPublicKey)
	if err != nil {
		return nil, fmt.Errorf("presign: bad ephemeral key: %w", err)
	}
	signature, err := hex.DecodeString(presign.Signature)
	if err != nil {
		return nil, fmt.Errorf("presign: bad signature: %w", err)
	}
	keyVersion, err := strconv.ParseUint(presign.KeyVersion, 10, 32)
	if err != nil {
		return nil, fmt.Errorf("presign: bad key version %q: %w", presign.KeyVersion, err)
	}

	var sessionID [8]byte
	if _, err := rand.Read(sessionID[:]); err != nil {
		return nil, err
	}

	negotiate, err := nfc.BuildNegotiate(nfc.NegotiateParams{
		SessionID:                  sessionID,
		CollectorID:                collectorID,
		KeyVersion:                 uint32(keyVersion),
		TerminalNonce:              terminalNonce,
		TerminalEphemeralPublicKey: terminalEphPub,
		Signature:                  signature,
	})
	if err != nil {
		return nil, err
	}
	body, sw, err := transmit(card, negotiate)
	if err != nil {
		return nil, fmt.Errorf("NEGOTIATE: %w", err)
	}
	if sw != nfc.SWOK {
		return nil, fmt.Errorf("NEGOTIATE rejected (SW %04x)", sw)
	}
	mobileEphPub, err := nfc.ParseNegotiateResponse(body)
	if err != nil {
		return nil, err
	}

	body, sw, err = transmit(card, nfc.BuildGetData(sessionID, collectorID))
	if err != nil {
		return nil, fmt.Errorf("GET DATA: %w", err)
	}
	full := append([]byte{}, body...)
	for sw == nfc.SWMoreData {
		body, sw, err = transmit(card, nfc.GetMoreData)
		if err != nil {
			return nil, fmt.Errorf("GET MORE DATA: %w", err)
		}
		full = append(full, body...)
	}
	switch sw {
	case nfc.SWOK:
	case nfc.SWNoPasses:
		return nil, errors.New("no eligible passes on the device")
	case nfc.SWChoosePass:
		return nil, errors.New("multiple passes eligible — the user must pick one on-screen and re-tap")
	default:
		return nil, fmt.Errorf("GET DATA rejected (SW %04x)", sw)
	}

	bundle, err := nfc.ExtractEncryptedBundle(full)
	if err != nil {
		return nil, err
	}
	return &api.ScanInput{
		ScanType: "nfc",
		Platform: "google",
		Payload:  hex.EncodeToString(bundle),
		Session: &api.SmartTapSession{
			TerminalNonce:               presign.TerminalNonce,
			MobileNonce:                 hex.EncodeToString(mobileNonce),
			TerminalEphemeralPublicKey:  presign.TerminalEphemeralPublicKey,
			TerminalEphemeralPrivateKey: presign.TerminalEphemeralPrivateKey,
			MobileEphemeralPublicKey:    hex.EncodeToString(mobileEphPub),
			Signature:                   presign.Signature,
		},
	}, nil
}
