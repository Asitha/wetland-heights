#!/usr/bin/env bash
# Generates a PDF of docs/brand-guidelines.html stamped with the current
# git commit short hash on the cover and footer, so the rendered artifact
# is traceable to a specific source revision.
#
# Usage: ./scripts/generate-brand-guidelines-pdf.sh [output_path]
#
# Default output: docs/brand-guidelines-<shorthash>.pdf
# Requires: git, python3, headless Chrome (macOS Google Chrome.app or `google-chrome` / `chromium` on PATH)
# Note: if docs/brand-guidelines.html has uncommitted changes, the hash on the
#       PDF will be marked "<hash>-dirty" since it no longer represents HEAD.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC_HTML="$REPO_ROOT/docs/brand-guidelines.html"

if [ ! -f "$SRC_HTML" ]; then
    echo "Error: $SRC_HTML not found" >&2
    exit 1
fi

# Resolve Chrome binary
CHROME=""
for candidate in \
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    "/Applications/Chromium.app/Contents/MacOS/Chromium" \
    "$(command -v google-chrome 2>/dev/null || true)" \
    "$(command -v chromium 2>/dev/null || true)" \
    "$(command -v chrome 2>/dev/null || true)"; do
    if [ -n "$candidate" ] && [ -x "$candidate" ]; then
        CHROME="$candidate"
        break
    fi
done

if [ -z "$CHROME" ]; then
    echo "Error: no Chrome/Chromium binary found. Install Google Chrome or Chromium." >&2
    exit 1
fi

# Compute short hash; tag as -dirty if brand-guidelines.html is modified
SHORT_HASH=$(git -C "$REPO_ROOT" rev-parse --short=8 HEAD)
if ! git -C "$REPO_ROOT" diff --quiet -- "$SRC_HTML" 2>/dev/null \
   || ! git -C "$REPO_ROOT" diff --cached --quiet -- "$SRC_HTML" 2>/dev/null; then
    SHORT_HASH="${SHORT_HASH}-dirty"
    echo "Warning: docs/brand-guidelines.html has uncommitted changes; tagging PDF as ${SHORT_HASH}" >&2
fi

OUTPUT="${1:-$REPO_ROOT/docs/brand-guidelines-${SHORT_HASH}.pdf}"

TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT
TMP_HTML="$TMPDIR/brand-guidelines.html"

# Inject the hash next to the cover version label and into the footer.
# Using python3 instead of sed to avoid the `&` = whole-match gotcha.
python3 - "$SRC_HTML" "$TMP_HTML" "$SHORT_HASH" <<'PY'
import sys
src_path, dst_path, short_hash = sys.argv[1:4]
src = open(src_path).read()

cover_old = '<span class="version">February 2026</span>'
cover_new = f'<span class="version">February 2026 &middot; rev {short_hash}</span>'
footer_old = 'Wetland Heights Brand Guidelines &middot; February 2026'
footer_new = f'{footer_old} &middot; rev {short_hash}'

for old, new in [(cover_old, cover_new), (footer_old, footer_new)]:
    if old not in src:
        print(f"Error: expected substring not found: {old!r}", file=sys.stderr)
        sys.exit(1)
    src = src.replace(old, new, 1)

open(dst_path, "w").write(src)
PY

mkdir -p "$(dirname "$OUTPUT")"

"$CHROME" \
    --headless \
    --disable-gpu \
    --no-pdf-header-footer \
    --print-to-pdf-no-header \
    --print-to-pdf="$OUTPUT" \
    --virtual-time-budget=10000 \
    "file://$TMP_HTML" >/dev/null 2>&1

if [ ! -s "$OUTPUT" ]; then
    echo "Error: Chrome did not produce a PDF at $OUTPUT" >&2
    exit 1
fi

echo "Generated: $OUTPUT"
echo "Revision:  $SHORT_HASH"
