#!/bin/sh
# Build, sign with the Samsung profile, install on the TV and launch with the web inspector.
# Usage: scripts/tv.sh <tv-ip>   (Samsung certificate profile "30nama" must exist)
set -e
TV="${1:?usage: scripts/tv.sh <tv-ip>}"
TIZEN="$HOME/tizen-studio/tools/ide/bin/tizen"
SDB="$HOME/tizen-studio/tools/sdb"
APP_ID="SiNamaTV01.SiNamaTV"
OUT="$(mktemp -d)"

cd "$(dirname "$0")/.."
npm run build
cp -R dist/ "$OUT/app"
"$TIZEN" package -t wgt -s 30nama -- "$OUT/app" -o "$OUT" >/dev/null
WGT="$(ls "$OUT"/*.wgt)"
mv "$WGT" "$OUT/30nama-tv.wgt"

# The sdb connection drops between runs, so reconnect every time.
"$SDB" connect "$TV:26101" >/dev/null
"$TIZEN" install -n "$OUT/30nama-tv.wgt" -s "$TV:26101" | grep -E "installed|error|fail" || true
"$SDB" -s "$TV:26101" shell 0 debug "$APP_ID" | tail -1
echo "wgt: $OUT/30nama-tv.wgt"
