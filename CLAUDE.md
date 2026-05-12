# passninja-cli notes for Claude Code

## What this repo is

The Go CLI for the PassNinja REST API. Module path
`github.com/flomio/passninja-cli`. Cobra + Viper, Go 1.22+. Distributed via
Homebrew from the `flomio/homebrew-passninja` tap.

Predecessor was a TypeScript NFC scanner (Webpack 4 + Jest). That source is
preserved on the `legacy/nfc-scanner` tag — see `git show legacy/nfc-scanner`
if you ever need to read it. Do not resurrect it.

## Top-level layout

```
cmd/    — one file per Cobra command. cmd/root.go wires the API client
          onto cmd.Context() in PersistentPreRunE.
pkg/
  api/      — HTTP client + per-resource methods (pass templates, passes,
              webhooks). do() handles retry on 429/5xx.
  auth/     — ~/.passninja-auth.json read/write + interactive prompt.
  config/   — Viper bootstrap; env var binding (PASSNINJA_*).
  output/   — Mode (table | json | plaintext); PrintJSON / PrintTable;
              Error/Success/Info/Warn split between stderr/stdout.
  utils/    — ids.go (ptk_/aid_ helpers), input.go (--field k=v parsing).
.github/workflows/release.yml — tag-triggered build + tap bump.
```

## When you add a new endpoint to passninja-site

1. Add the resource method to `pkg/api/<resource>.go`. Use `c.do(ctx, method,
   path, body, &out)`.
2. Add a command file in `cmd/<resource>_<verb>.go`. Mount it under the parent
   resource command in that file's `init()`.
3. Add a row helper in `pkg/output/tables.go` if the response is a list.
4. Update the command tree in `README.md`.

## Output rules

- Errors go to stderr (`output.Error`), payloads to stdout. This lets scripts
  pipe `passninja … --json` straight to `jq` without filtering.
- The default is `table`. `--json` and `--plaintext` are mutually exclusive; if
  both are passed, `--json` wins (more useful for downstream parsing).
- `webhook create` prints the bearer token to stdout once. In `--json` mode it
  sits inside the response object; in table/plaintext it gets a separate
  `output.Warn("Save this token now — it will not be shown again.")` line.

## Auth file

`~/.passninja-auth.json` is 0600, written atomically via `os.Rename`. Contains
`api_key`, `account_id`, `base_url`, `saved_at`. Never log its contents. Never
commit a test fixture that points at the user's home.

## Release pipeline

`.github/workflows/release.yml` runs on `push: tags: ['v*']`. It:
1. Matrix-builds darwin/{arm64,amd64} + linux/{arm64,amd64} with `make
   build-all`, writes `dist/<binary>` and `dist/SHA256SUMS`.
2. Uploads the binaries + checksum to the GitHub Release.
3. Clones `flomio/homebrew-passninja`, sed-replaces the formula `url` and the
   matching `sha256`, opens a PR. Auth via the `HOMEBREW_TAP_TOKEN` repo
   secret (PAT scoped to the tap).
