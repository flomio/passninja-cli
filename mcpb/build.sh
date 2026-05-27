#!/usr/bin/env bash
# Bundle the passninja CLI as a Claude Desktop MCP Bundle (.mcpb).
#
# Produces a single fat .mcpb that carries:
#   - a universal macOS binary (arm64 + amd64 via lipo)
#   - a linux amd64 binary
#   - a windows amd64 binary
#
# Run from the repo root:
#   make mcpb
# or directly:
#   ./mcpb/build.sh

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST="$REPO_ROOT/dist"
STAGING="$REPO_ROOT/dist/mcpb-staging"
OUT="$DIST/passninja.mcpb"

cd "$REPO_ROOT"

if [[ ! -f "$DIST/passninja-darwin-arm64" \
   || ! -f "$DIST/passninja-darwin-amd64" \
   || ! -f "$DIST/passninja-linux-amd64" \
   || ! -f "$DIST/passninja-windows-amd64.exe" ]]; then
  echo "[mcpb] platform binaries missing in $DIST/; run 'make build-all' first" >&2
  exit 1
fi

rm -rf "$STAGING" "$OUT"
mkdir -p "$STAGING/server"

# macOS universal binary (Intel + Apple Silicon) so one .mcpb works on both.
if command -v lipo >/dev/null 2>&1; then
  lipo -create \
    "$DIST/passninja-darwin-arm64" \
    "$DIST/passninja-darwin-amd64" \
    -output "$STAGING/server/passninja-darwin"
else
  # lipo only ships on macOS; on Linux CI we just bundle the arm64 build,
  # which is the dominant Claude Desktop install base today.
  cp "$DIST/passninja-darwin-arm64" "$STAGING/server/passninja-darwin"
  echo "[mcpb] lipo not available — bundled arm64 mac binary only" >&2
fi
chmod +x "$STAGING/server/passninja-darwin"

cp "$DIST/passninja-linux-amd64"      "$STAGING/server/passninja-linux"
cp "$DIST/passninja-windows-amd64.exe" "$STAGING/server/passninja-windows.exe"
chmod +x "$STAGING/server/passninja-linux"

# Codesign the macOS binary if Apple Developer ID identity is configured.
# Without this, macOS Gatekeeper blocks the bundled binary on first run.
SIGN_IDENTITY="${APPLE_SIGN_IDENTITY:-}"
if [[ -n "$SIGN_IDENTITY" ]]; then
  echo "[mcpb] codesigning macOS binary: $SIGN_IDENTITY"
  codesign --force --options runtime --timestamp \
    --sign "$SIGN_IDENTITY" \
    --identifier "com.passninja.cli" \
    "$STAGING/server/passninja-darwin"
  codesign --verify --strict --verbose=2 "$STAGING/server/passninja-darwin" 2>&1 | sed 's/^/[mcpb] /'
else
  echo "[mcpb] APPLE_SIGN_IDENTITY unset — macOS binary will be unsigned (Gatekeeper-blocked on first run)" >&2
fi

cp "$REPO_ROOT/mcpb/manifest.json" "$STAGING/manifest.json"
cp "$REPO_ROOT/mcpb/icon.png"      "$STAGING/icon.png"

# Inject the CLI's git-described version into the manifest so .mcpb version
# tracks releases. Falls back to whatever the manifest already declares.
VERSION="$(git describe --tags --always --dirty 2>/dev/null | sed 's/^v//')"
if [[ -n "$VERSION" ]]; then
  python3 -c "
import json, sys
p = '$STAGING/manifest.json'
m = json.load(open(p))
m['version'] = '$VERSION'
json.dump(m, open(p, 'w'), indent=2)
print(m['version'])
" >/dev/null
fi

# .mcpb is just a zip with manifest.json at the root.
(cd "$STAGING" && zip -qr "$OUT" .)
rm -rf "$STAGING"

# Notarize the .mcpb via App Store Connect API when credentials are present.
# A .mcpb is a zip — notarytool happily accepts it. Stapling isn't supported
# on raw zips, so Gatekeeper performs an online ticket check on first run.
NOTARY_KEY="${APPLE_API_KEY_PATH:-}"
NOTARY_ID="${APPLE_API_KEY_ID:-}"
NOTARY_ISSUER="${APPLE_API_ISSUER_ID:-}"
if [[ -n "$NOTARY_KEY" && -f "$NOTARY_KEY" && -n "$NOTARY_ID" && -n "$NOTARY_ISSUER" ]]; then
  echo "[mcpb] submitting $OUT to Apple notary service (key id $NOTARY_ID)..."
  xcrun notarytool submit "$OUT" \
    --key "$NOTARY_KEY" \
    --key-id "$NOTARY_ID" \
    --issuer "$NOTARY_ISSUER" \
    --wait 2>&1 | sed 's/^/[mcpb] /'
else
  echo "[mcpb] notarization skipped (APPLE_API_KEY_PATH/ID/ISSUER_ID not all set)" >&2
fi

ls -lh "$OUT"
echo "[mcpb] built: $OUT"
