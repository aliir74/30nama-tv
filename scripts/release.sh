#!/bin/sh
# Builds the release zip: the web app without the client key, plus an empty config.json that the
# user fills in before signing it with their own Samsung certificate (see README, Install 4a).
# Usage: scripts/release.sh   -> release/30nama-tv-<version>.zip
set -e
cd "$(dirname "$0")/.."
VERSION="$(node -p 'require("./package.json").version')"
OUT="release/30nama-tv"

# An empty VITE_API_KEY in the environment wins over .env.local, so the key stays out of the build.
VITE_API_KEY= npm run build

# Refuse to ship if the key from .env.local made it into the bundle anyway.
if [ -f .env.local ]; then
  KEY="$(sed -n 's/^VITE_API_KEY=//p' .env.local)"
  if [ -n "$KEY" ] && grep -rqF "$KEY" dist; then
    echo "release: the client key is in dist/; not packaging" >&2
    exit 1
  fi
fi

rm -rf release && mkdir -p "$OUT"
cp -R dist/. "$OUT/"
printf '{ "apiKey": "" }\n' > "$OUT/config.json"
(cd release && zip -qr "30nama-tv-$VERSION.zip" 30nama-tv)
echo "release/30nama-tv-$VERSION.zip"
