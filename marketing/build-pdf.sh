#!/bin/bash
# Rendert die Flyer-HTMLs zu PDF (Seitenformat via @page in der CSS).
# Braucht Google Chrome.
set -euo pipefail
cd "$(dirname "$0")"

CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
[ -x "$CHROME" ] || CHROME="$(command -v google-chrome || command -v chromium || true)"
[ -n "$CHROME" ] || { echo "Chrome nicht gefunden. CHROME=<pfad> setzen." >&2; exit 1; }

for name in flyer-glacetruhe flyer-a5-tisch; do
  "$CHROME" --headless --disable-gpu --no-pdf-header-footer \
    --print-to-pdf="${name}.pdf" \
    --virtual-time-budget=3000 \
    "file://$(pwd)/${name}.html"
  echo "-> $(pwd)/${name}.pdf"
done
