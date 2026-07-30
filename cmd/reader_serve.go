package cmd

import (
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/flomio/passninja-cli/pkg/api"
	"github.com/flomio/passninja-cli/pkg/reader"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var (
	serveToken        string
	serveListen       string
	servePlatform     string
	serveHeartbeat    time.Duration
	serveNoHeartbeat  bool
	serveSerial       string
	serveManufacturer string
	serveModel        string
	serveFirmware     string
	serveSource       string
	serveOnAccept     string
	serveOnReject     string
)

var readerServeCmd = &cobra.Command{
	Use:   "serve",
	Short: "Run this machine as a reader host, submitting taps as scan events",
	Long: `Run this machine as a PassNinja reader host: take the values a locally
attached NFC reader captures, submit them as scan events, and apply the
LED/beep instruction the server returns.

This is how a simple reader (Reyax RYRR30D, ACS WalletMate, Elatec TWN4)
joins the scan system: it has no cloud connection of its own, so this host
supplies one. Readers that are already cloud-connected (VTAP Cloud, Famoco
Tap&Go) post scans directly and do not need this.

Authentication is the per-reader bearer token minted by ` + "`reader create`" + `,
never your account API key. Pass it with --token, or set PASSNINJA_READER_TOKEN.

Tap values arrive either on stdin (one per line — pipe your reader daemon's
output in) or over a loopback HTTP endpoint with --listen, which a driver
POSTs to. A value that looks like raw captured APDUs is forwarded for
server-side decryption; anything else is treated as an already-decrypted
pass serial.

Each scan result is printed to stdout as one JSON object. Use --on-accept /
--on-reject to run a command per outcome — that is how a Raspberry Pi drives
a GPIO LED. The hook receives $PN_RESULT, $PN_LED, $PN_MESSAGE, $PN_PASS,
and $PN_SCAN_ID.

Examples:
  # a daemon that prints one tap value per line
  my-reader-daemon | passninja reader serve --token rdr_...

  # local endpoint a driver POSTs to, green/red LED via GPIO
  passninja reader serve --token rdr_... --listen 127.0.0.1:8080 \
    --on-accept 'gpioset 0 17=1' --on-reject 'gpioset 0 27=1'`,
	SilenceUsage:  true,
	SilenceErrors: true,
	RunE: func(cmd *cobra.Command, _ []string) error {
		token := serveToken
		if token == "" {
			token = os.Getenv("PASSNINJA_READER_TOKEN")
		}
		if token == "" {
			token = viper.GetString("reader_token")
		}
		if token == "" {
			return fmt.Errorf("a reader token is required: pass --token, or set PASSNINJA_READER_TOKEN (mint one with `passninja reader create`)")
		}

		baseURL := flagBaseURL
		if baseURL == "" {
			baseURL = viper.GetString("base_url")
		}

		// A reader host is long-lived: give it a client with no request
		// timeout ceiling beyond the per-call context, and its own bearer.
		client := api.NewReaderClient(
			token,
			api.WithBaseURL(baseURL),
			api.WithHTTPClient(&http.Client{Timeout: 30 * time.Second}),
			api.WithUserAgent("passninja-cli/"+buildVersion),
			api.WithDebug(flagDebug || viper.GetBool("debug")),
		)

		interval := serveHeartbeat
		if serveNoHeartbeat {
			interval = 0
		}

		// Ctrl-C / SIGTERM unwinds the host cleanly: in-flight scan finishes,
		// the listener drains, then Serve returns.
		ctx, stop := signal.NotifyContext(cmd.Context(), os.Interrupt, syscall.SIGTERM)
		defer stop()

		return reader.Serve(ctx, client, reader.Options{
			Listen:            serveListen,
			Platform:          servePlatform,
			HeartbeatInterval: interval,
			Hardware: api.HeartbeatInput{
				Serial:       serveSerial,
				Manufacturer: serveManufacturer,
				Model:        serveModel,
				Firmware:     serveFirmware,
				Source:       serveSource,
			},
			OnAccept: serveOnAccept,
			OnReject: serveOnReject,
		})
	},
}

func init() {
	f := readerServeCmd.Flags()
	f.StringVar(&serveToken, "token", "", "reader bearer token (rdr_...); falls back to PASSNINJA_READER_TOKEN")
	f.StringVar(&serveListen, "listen", "", "loopback address for a local ingest endpoint, e.g. 127.0.0.1:8080 (default: read stdin)")
	f.StringVar(&servePlatform, "platform", "", "apple | google; omit to let the server try each bound template")
	f.DurationVar(&serveHeartbeat, "heartbeat", 5*time.Minute, "how often to report liveness and hardware identity")
	f.BoolVar(&serveNoHeartbeat, "no-heartbeat", false, "disable heartbeats (for readers whose vendor MDM already tracks them)")
	f.StringVar(&serveSerial, "serial", "", "hardware serial to report")
	f.StringVar(&serveManufacturer, "manufacturer", "", "hardware manufacturer to report")
	f.StringVar(&serveModel, "model", "", "hardware model to report")
	f.StringVar(&serveFirmware, "firmware", "", "hardware firmware version to report")
	f.StringVar(&serveSource, "source", "cli-client", "cli-client | api | vtap-cloud | famoco")
	f.StringVar(&serveOnAccept, "on-accept", "", "shell command to run when a scan is accepted")
	f.StringVar(&serveOnReject, "on-reject", "", "shell command to run when a scan is rejected")
	readerCmd.AddCommand(readerServeCmd)
}
