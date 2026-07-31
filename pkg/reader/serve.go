// Package reader runs this machine as a PassNinja reader host: it takes the
// values a locally-attached NFC reader captures, submits them as scan events,
// and applies the LED/beep instruction the server returns.
//
// The host is deliberately hardware-agnostic. Simple readers (Reyax RYRR30D,
// ACS WalletMate, Elatec TWN4) speak many different local protocols, so rather
// than bind to one, Serve accepts tap values from either:
//
//   - stdin, one value per line — pipe any reader daemon's output in; or
//   - a loopback HTTP endpoint (--listen), which a driver POSTs to.
//
// Feedback is surfaced two ways: printed to stdout as JSON (so a supervising
// process can drive the LED), and optionally by running a hook command per
// outcome (--on-accept / --on-reject), which is how a Raspberry Pi toggles
// GPIO.
package reader

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"strings"
	"sync"
	"time"

	"github.com/flomio/passninja-cli/pkg/api"
)

// Options configures a reader host run.
type Options struct {
	// Source of tap values. Exactly one is used: Listen wins when set.
	Listen string // loopback address for the local ingest endpoint, e.g. 127.0.0.1:8080
	Input  io.Reader

	// HeartbeatInterval reports liveness + hardware identity on a timer. Zero
	// disables heartbeats (correct for vtap-cloud / famoco sources, whose
	// vendor MDM already tracks the device).
	HeartbeatInterval time.Duration
	Hardware          api.HeartbeatInput

	// Platform is the wallet side taps are expected from ("apple" | "google"
	// | ""). Empty lets the server try each bound template.
	Platform string

	// OnAccept / OnReject are shell commands run after each scan, given the
	// result as $PN_RESULT, the LED color as $PN_LED, and the pass serial as
	// $PN_PASS. Empty disables the hook.
	OnAccept string
	OnReject string

	// Out receives the per-scan JSON lines; Status receives lifecycle lines.
	Out    io.Writer
	Status io.Writer
}

// Serve blocks until ctx is cancelled or the input source ends. The client
// must be reader-token authenticated (api.NewReaderClient).
func Serve(ctx context.Context, client *api.Client, opts Options) error {
	if client == nil {
		return fmt.Errorf("reader.Serve: api client is nil")
	}
	if opts.Out == nil {
		opts.Out = os.Stdout
	}
	if opts.Status == nil {
		opts.Status = os.Stderr
	}
	if opts.Input == nil {
		opts.Input = os.Stdin
	}

	// An initial heartbeat doubles as a credential check: a bad reader token
	// fails here rather than on the first real tap.
	if opts.HeartbeatInterval > 0 {
		if res, err := client.Heartbeat(ctx, opts.Hardware); err != nil {
			return fmt.Errorf("initial heartbeat failed (is the reader token valid, and is scan-events-heartbeat enabled?): %w", err)
		} else {
			fmt.Fprintf(opts.Status, "[passninja reader] registered reader %s, heartbeat every %s\n", res.ID, opts.HeartbeatInterval)
		}
	}

	ctx, cancel := context.WithCancel(ctx)
	defer cancel()

	var wg sync.WaitGroup
	if opts.HeartbeatInterval > 0 {
		wg.Add(1)
		go func() {
			defer wg.Done()
			runHeartbeat(ctx, client, opts)
		}()
	}

	var err error
	if opts.Listen != "" {
		err = serveHTTP(ctx, client, opts)
	} else {
		err = serveStdin(ctx, client, opts)
	}

	cancel()
	wg.Wait()
	return err
}

// runHeartbeat reports liveness until ctx ends. A failed beat is logged and
// retried on the next tick — a transient outage must not kill the host.
func runHeartbeat(ctx context.Context, client *api.Client, opts Options) {
	t := time.NewTicker(opts.HeartbeatInterval)
	defer t.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-t.C:
			if _, err := client.Heartbeat(ctx, opts.Hardware); err != nil && ctx.Err() == nil {
				fmt.Fprintf(opts.Status, "[passninja reader] heartbeat failed: %v\n", err)
			}
		}
	}
}

// serveStdin reads one tap value per line. Blank lines are skipped so a
// driver can flush freely.
func serveStdin(ctx context.Context, client *api.Client, opts Options) error {
	fmt.Fprintf(opts.Status, "[passninja reader] ready, reading tap values from stdin (one per line)\n")

	lines := make(chan string)
	go func() {
		defer close(lines)
		sc := bufio.NewScanner(opts.Input)
		sc.Buffer(make([]byte, 0, 64*1024), 1024*1024)
		for sc.Scan() {
			lines <- sc.Text()
		}
	}()

	for {
		select {
		case <-ctx.Done():
			fmt.Fprintf(opts.Status, "[passninja reader] shutting down\n")
			return nil
		case line, ok := <-lines:
			if !ok {
				fmt.Fprintf(opts.Status, "[passninja reader] input closed, shutting down\n")
				return nil
			}
			value := strings.TrimSpace(line)
			if value == "" {
				continue
			}
			handleTap(ctx, client, opts, value)
		}
	}
}

// serveHTTP exposes POST / on a loopback address. The body is either a raw
// tap value or {"message"|"payload": "..."} for callers that prefer JSON.
func serveHTTP(ctx context.Context, client *api.Client, opts Options) error {
	mux := http.NewServeMux()
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "POST a tap value to this endpoint", http.StatusMethodNotAllowed)
			return
		}
		body, err := io.ReadAll(io.LimitReader(r.Body, 1<<20))
		if err != nil {
			http.Error(w, "read body", http.StatusBadRequest)
			return
		}
		value := strings.TrimSpace(string(body))
		if strings.HasPrefix(value, "{") {
			var in struct {
				Message string `json:"message"`
				Payload string `json:"payload"`
			}
			if json.Unmarshal([]byte(value), &in) == nil {
				if in.Message != "" {
					value = in.Message
				} else {
					value = in.Payload
				}
			}
		}
		if value == "" {
			http.Error(w, "empty tap value", http.StatusBadRequest)
			return
		}
		res := handleTap(r.Context(), client, opts, value)
		w.Header().Set("Content-Type", "application/json")
		if res == nil {
			w.WriteHeader(http.StatusBadGateway)
			_ = json.NewEncoder(w).Encode(map[string]string{"error": "scan submission failed"})
			return
		}
		_ = json.NewEncoder(w).Encode(res)
	})

	srv := &http.Server{Addr: opts.Listen, Handler: mux, ReadHeaderTimeout: 5 * time.Second}
	fmt.Fprintf(opts.Status, "[passninja reader] ready, POST tap values to http://%s/\n", opts.Listen)

	errCh := make(chan error, 1)
	go func() { errCh <- srv.ListenAndServe() }()
	select {
	case <-ctx.Done():
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_ = srv.Shutdown(shutdownCtx)
		fmt.Fprintf(opts.Status, "[passninja reader] shutting down\n")
		return nil
	case err := <-errCh:
		if err == http.ErrServerClosed {
			return nil
		}
		return err
	}
}

// handleTap submits one captured value and applies the returned instruction.
// A submission failure is reported but never fatal — the host keeps serving.
func handleTap(ctx context.Context, client *api.Client, opts Options, value string) *api.ScanResponse {
	in := api.ScanInput{ScanType: "nfc", Platform: opts.Platform}
	// A hex-only string long enough to be a captured payload is forwarded for
	// server-side decryption; anything else is already the decrypted value.
	if isHexPayload(value) {
		in.Payload = value
	} else {
		in.Message = value
	}

	res, err := client.Scan(ctx, in)
	if err != nil {
		fmt.Fprintf(opts.Status, "[passninja reader] scan failed: %v\n", err)
		return nil
	}

	enc := json.NewEncoder(opts.Out)
	_ = enc.Encode(res)

	runHook(ctx, opts, res)
	return res
}

// isHexPayload reports whether the value looks like raw captured APDUs rather
// than a decrypted pass serial. Serials are hex too, so length is the
// discriminator: a captured payload is far longer than a 18-char serial.
func isHexPayload(s string) bool {
	if len(s) < 64 || len(s)%2 != 0 {
		return false
	}
	for _, r := range s {
		if !((r >= '0' && r <= '9') || (r >= 'a' && r <= 'f') || (r >= 'A' && r <= 'F')) {
			return false
		}
	}
	return true
}

// runHook fires the accept/reject command with the scan outcome in the
// environment. Hook failures are logged, never fatal.
func runHook(ctx context.Context, opts Options, res *api.ScanResponse) {
	hook := opts.OnReject
	if res.ReaderInstructions.Success {
		hook = opts.OnAccept
	}
	if hook == "" {
		return
	}
	pass := ""
	if res.Pass != nil {
		pass = res.Pass.PassID
	}
	cmd := exec.CommandContext(ctx, "sh", "-c", hook)
	cmd.Env = append(os.Environ(),
		"PN_RESULT="+res.Result,
		"PN_LED="+res.ReaderInstructions.LED,
		"PN_MESSAGE="+res.ReaderInstructions.Message,
		"PN_PASS="+pass,
		"PN_SCAN_ID="+res.ScanID,
	)
	cmd.Stdout = opts.Status
	cmd.Stderr = opts.Status
	if err := cmd.Run(); err != nil && ctx.Err() == nil {
		fmt.Fprintf(opts.Status, "[passninja reader] hook failed: %v\n", err)
	}
}
