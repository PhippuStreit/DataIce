#!/bin/bash
# Rendert flyer-glacetruhe.html zu flyer-glacetruhe.pdf (A4, 1 Seite).
# Braucht Google Chrome.
set -euo pipefail
cd "$(dirname "$0")"

CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
[ -x "$CHROME" ] || CHROME="$(command -v google-chrome || command -v chromium || true)"
[ -n "$CHROME" ] || { echo "Chrome nicht gefunden. CHROME=<pfad> setzen." >&2; exit 1; }

"$CHROME" --headless --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="flyer-glacetruhe.pdf" \
  --virtual-time-budget=3000 \
  "file://$(pwd)/flyer-glacetruhe.html"

echo "-> $(pwd)/flyer-glacetruhe.pdf"
