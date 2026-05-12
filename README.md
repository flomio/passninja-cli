# passninja

Command-line interface for the [PassNinja](https://www.passninja.com) REST API.
Wraps `/v1/pass_templates`, `/v1/passes`, and `/v1/webhooks` so you can
manage Apple Wallet and Google Wallet passes from the shell.

## Install

```sh
brew tap flomio/passninja
brew install passninja
```

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

## Commands

```text
passninja auth                                       Save API credentials
passninja whoami                                     Show the active credential / account
passninja version

passninja pass-template list
passninja pass-template get <ptk_0x...>
passninja pass-template required-fields <ptk_0x...>
passninja pass-template create --name --platform --style    # enterprise only
passninja pass-template delete <ptk_0x...> [--yes]          # enterprise only

passninja pass create <ptk_0x...> [--field k=v | --data @file.json | --data '<json>']
passninja pass list <ptk_0x...>
passninja pass get <ptk_0x...> <pass_id>
passninja pass raw <ptk_0x...> <pass_id>
passninja pass update <ptk_0x...> <pass_id> [--field k=v | --data ... | --replace]
passninja pass delete <ptk_0x...> <pass_id> [--yes]
passninja pass decrypt <ptk_0x...> [--payload <b64> | --payload-file <path> | <stdin>]

# Enterprise only:
passninja webhook create --name --url --event <type> [--event <type> ...] [--pass-template ptk_0x...]
passninja webhook list [--page --per-page --pass-template]
passninja webhook get <webhook_id>
passninja webhook delete <webhook_id> [--yes]
passninja webhook results <webhook_id> [--page --per-page]
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

Reserved for future use: `pn.pass.issued`, `pn.pass.deleted`,
`pn.pass_template.created`, `pn.pass_template.updated`,
`pn.pass_template.deleted`.

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
publishes the binaries on the GitHub Release, and opens a PR against
`flomio/homebrew-passninja` bumping the formula `url` and `sha256`.
