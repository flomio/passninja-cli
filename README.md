# passninja

Command-line interface for the [PassNinja](https://www.passninja.com) REST API.
Wraps `/v1/pass_templates`, `/v1/passes`, and `/v1/webhooks` so you can
manage Apple Wallet and Google Wallet passes from the shell.

## Install

### macOS / Linux (Homebrew)

```sh
brew tap flomio/passninja
brew install passninja
```

### Windows (PowerShell)

```powershell
irm https://github.com/flomio/passninja-cli/releases/latest/download/install.ps1 | iex
```

From `cmd.exe`:

```cmd
powershell -ExecutionPolicy Bypass -Command "irm https://github.com/flomio/passninja-cli/releases/latest/download/install.ps1 | iex"
```

The script detects your CPU (amd64, arm64, or 386), downloads the matching
binary from the latest GitHub release, verifies its SHA256, drops it in
`%LOCALAPPDATA%\Programs\passninja\`, and adds that directory to your user
`PATH`. No admin needed; re-running upgrades in place.

Pin a specific version, or override the install directory:

```powershell
$env:PASSNINJA_VERSION = 'v1.2.3'
$env:PASSNINJA_INSTALL_DIR = 'C:\tools\passninja'
irm https://github.com/flomio/passninja-cli/releases/latest/download/install.ps1 | iex
```

### Windows (Scoop)

If you already use [Scoop](https://scoop.sh):

```powershell
scoop bucket add flomio https://github.com/flomio/scoop-passninja
scoop install passninja
```

### Claude Desktop (one-click `.mcpb` install)

For chat-driven pass workflows, install the PassNinja MCP server into
Claude Desktop:

1. Download [`passninja.mcpb`](https://github.com/flomio/passninja-cli/releases/latest/download/passninja.mcpb)
   from the latest release.
2. Double-click the file. Claude Desktop opens an install dialog showing the
   31 tools the server exposes (pass templates, issued passes, webhooks,
   scan-event applications and readers).
3. The dialog prompts for your **API key** and **account ID** —
   get them at https://www.passninja.com/settings → API key.
4. Hit Install, restart Claude Desktop, then ask Claude things like:

   > List my passninja pass templates and tell me how many passes are installed on each.
   >
   > Issue a new pass on ptk_0x002 for jane@example.com.

The bundled binary is code-signed with Apple Developer ID and notarized, so
macOS Gatekeeper accepts it without prompts. Same `.mcpb` works on macOS
(universal), Linux (amd64), and Windows (amd64).

The server is also listed in the official [MCP Registry](https://registry.modelcontextprotocol.io)
as `io.github.flomio/passninja-cli`, so any MCP client that consumes the
registry can discover and install it automatically.

## Authenticate

```sh
passninja auth
# Pastes your API key and account ID; verifies by hitting /v1/pass_templates
# and saves credentials to ~/.passninja-auth.json (0600).
```

Or pass credentials via env / flags:

```sh
export PASSNINJA_API_KEY=...        PASSNINJA_ACCOUNT_ID=aid_0x002
passninja --api-key=... --account-id=... pass-template list
```

Flag > env > `~/.passninja-auth.json` > `~/.passninja.yaml` > defaults.

The same precedence applies to the MCP server: `passninja mcp` (started by
Claude Desktop and other MCP clients) reads `PASSNINJA_API_KEY` /
`PASSNINJA_ACCOUNT_ID` from its environment, falling back to the auth file.

## Stdio MCP server

The CLI also doubles as a [Model Context Protocol](https://modelcontextprotocol.io)
server. The `.mcpb` install above wires this into Claude Desktop, but you can
hook it into any MCP client (Cursor, Cline, Zed, etc.) by configuring the
client to launch:

```
passninja mcp
```

Tool surface (snake_case names mirror the CLI subcommands):

```
whoami
pass_template_{list, get, required_fields, reader_config, create, delete}
pass_{list, get, create, update, delete, raw, decrypt}
webhook_{list, get, create, delete, results}
```

Each tool's input schema, destructive-hint annotations, and rich descriptions
let the LLM self-discover correct usage without external documentation.

## Commands

```text
passninja auth                                       Save API credentials
passninja whoami                                     Show the active credential / account
passninja version

passninja pass-template list
passninja pass-template get <ptk_0x...>
passninja pass-template required-fields <ptk_0x...>
passninja pass-template reader-config <ptk_0x...>          # NFC reader config (merchant id, collector, EC keys)
passninja pass-template create --name --platform --style [config flags]   # enterprise only
passninja pass-template update <ptk_0x...> [--name --set --remap --show/--hide --require/--optional] [config flags] [--replace]   # enterprise only
passninja pass-template delete <ptk_0x...> [--yes]          # enterprise only
#   config flags (create + update): --constrain-device/-browser/-ip,
#   --disable-apple-sharing/-google-sharing, --auto-recharge --balance-trigger --top-up-target

passninja pass create <ptk_0x...> [--field k=v | --data @file.json | --data '<json>']
passninja pass list <ptk_0x...>
passninja pass get <ptk_0x...> <pass_id>
passninja pass raw <ptk_0x...> <pass_id>
passninja pass update <ptk_0x...> <pass_id> [--field k=v | --data ... | --replace]
passninja pass delete <ptk_0x...> <pass_id> [--yes]
passninja pass decrypt <ptk_0x...> [--payload <hex> | --payload-file <path> | <stdin>] [--platform apple]
#   Google Smart Tap is session-bound — use `reader serve` on the reader host

# Enterprise only:
passninja webhook create --name --url --event <type> [--event <type> ...] [--pass-template ptk_0x...]
passninja webhook list [--page --per-page --pass-template]
passninja webhook get <webhook_id>
passninja webhook delete <webhook_id> [--yes]
passninja webhook results <webhook_id> [--page --per-page]

# Scan event system (premium):
passninja application list
passninja application get <app_0x...>
passninja application create --name --pass-template ptk_0x... [--kind log|validate|forward]
                             [--rescan-window <seconds>] [--endpoint-url <https>] [--description]
passninja application update <app_0x...> [--name --description --kind --rescan-window --endpoint-url --active/--inactive]
passninja application delete <app_0x...> [--yes]

passninja reader list
passninja reader get <reader_id>
passninja reader create --name --location --application app_0x... [--application ...]   # prints the token once
passninja reader update <reader_id> [--name --location --status active|revoked --application ...]
passninja reader rotate-token <reader_id> [--yes]
passninja reader delete <reader_id> [--yes]
passninja reader config <reader_id>                        # merged reader config across bound templates
passninja reader serve --token rdr_... [--listen host:port] [--platform apple|google]
                       [--heartbeat 5m | --no-heartbeat] [--serial --manufacturer --model --firmware --source]
                       [--on-accept '<cmd>'] [--on-reject '<cmd>']
```

## Output formats

| Flag | Mode |
| --- | --- |
| `--json` | Pretty-printed JSON |
| `--plaintext` | Tab-separated, no decoration (good for piping to `awk`) |
| _default_ | Bordered ASCII table |

Set a session-wide default via `~/.passninja.yaml`:

```yaml
default_output: json    # one of: table | json | plaintext
base_url: https://api.passninja.com/v1
```

## Webhook events

The CloudEvents 1.0 `type` taxonomy emitted by passninja-site:

| Event type | When it fires |
| --- | --- |
| `pn.pass.installed` | First device installs an issued pass |
| `pn.pass.updated`   | Pass fields change via PATCH/PUT |
| `pn.pass.uninstalled` | Last device removes the pass |
| `pn.pass.scanned` | A reader records a scan event (carries scanId, readerSerial, result) |

Reserved for future use: `pn.pass.issued`, `pn.pass.deleted`,
`pn.pass_template.created`, `pn.pass_template.updated`,
`pn.pass_template.deleted`.

## Running a reader host

Cloud-connected readers (VTAP Cloud, Famoco Tap&Go) post scans to PassNinja
themselves. A simple reader — Reyax RYRR30D, ACS WalletMate, Elatec TWN4 —
has no cloud connection of its own, so `reader serve` supplies one: it takes
the values the reader captures, submits them as scan events, and applies the
LED/beep instruction the server returns.

Setup is three steps, and only the last one runs on the reader host:

```sh
# 1. an application decides what a scan means for one pass template
passninja application create --name "Front gate" --kind validate \
  --pass-template ptk_0x216 --rescan-window 14400

# 2. a reader binds to it; the token is printed once — save it
passninja reader create --name "Front gate" --location "Gate 2" \
  --application app_0x1

# 3. on the reader host (a Raspberry Pi, a kiosk PC, …)
my-reader-daemon | passninja reader serve --token rdr_...
```

`serve` authenticates as that one reader with its bearer token — a reader
host never needs, and should never hold, your account API key.

Tap values arrive on **stdin** (one per line) or over a **loopback HTTP
endpoint** with `--listen 127.0.0.1:8080`, which a driver POSTs to. A value
that looks like raw captured APDUs is forwarded for server-side decryption;
anything else is treated as an already-decrypted pass serial.

Each result is one JSON object on stdout:

```json
{"scanId":"9f8e7d6c-…","result":"accepted","pass":{"passTemplate":"ptk_0x216","passId":"fee4a257185906b92a"},
 "readerInstructions":{"success":true,"led":"green","beep":true,"message":"Accepted"}}
```

To drive a physical LED, use the outcome hooks — they receive `$PN_RESULT`,
`$PN_LED`, `$PN_MESSAGE`, `$PN_PASS`, and `$PN_SCAN_ID`:

```sh
passninja reader serve --token rdr_... \
  --on-accept 'gpioset 0 17=1' --on-reject 'gpioset 0 27=1'
```

Heartbeats (default every 5m) report liveness plus the hardware identity you
pass with `--serial` / `--manufacturer` / `--model` / `--firmware`, which is
what fills in the reader's Hardware panel in the dashboard. Readers whose
vendor MDM already tracks them should use `--no-heartbeat`.

`passninja webhook create` returns the bearer token **once** on creation.
Save it — it will not be shown again.

## Build from source

```sh
git clone https://github.com/flomio/passninja-cli.git
cd passninja-cli
make build                 # writes dist/passninja
./dist/passninja version
make install               # installs to $GOPATH/bin
```

## Release flow

Tag-driven. Push a `vX.Y.Z` tag on master; the GitHub Actions workflow at
`.github/workflows/release.yml` matrix-builds darwin/linux × arm64/amd64,
packages a code-signed + Apple-notarized `passninja.mcpb` on a macOS runner,
publishes both the binaries and the `.mcpb` on the GitHub Release, and opens
a PR against `flomio/homebrew-passninja` bumping the formula `url` and
`sha256`.

Apple credentials live in repo secrets (`APPLE_TEAM_ID`,
`APPLE_API_KEY_ID`, `APPLE_API_ISSUER_ID`, `APPLE_SIGN_IDENTITY`,
`APPLE_CERTIFICATE_PASSWORD`, plus the base64-encoded `APPLE_API_KEY_P8`
and `APPLE_CERTIFICATE_P12`).

After each tagged release, the MCP Registry entry needs a refresh. Bump
`packages[0].identifier`, `packages[0].version`, `packages[0].fileSha256`,
and the top-level `version` in `server.json` to match the new release, then:

```sh
mcp-publisher login github      # one-time per machine
mcp-publisher publish
```
