# 30nama TV (Samsung Tizen)

An unofficial Samsung TV (Tizen) web app for [30nama](https://30nama.com): browse, search and stream
with Persian subtitles, driven entirely by the TV remote. Persian RTL UI.

It talks to the same v2 API as the official 30nama Android TV client. You need your own 30nama
account; sign-in is by QR code from a phone or computer that is already logged in.

## Features

- QR login, home rows, continue watching (with dismiss)
- Side menu: search (on-screen Persian/English keyboard), browse by category and genre,
  advanced filters, my list (watchlist, favorites), notifications, account and settings
- Title pages with seasons, episodes, watchlist/favorite toggles, cast and director pages
- Player: HLS via hls.js, quality choice, Persian/English subtitles (SRT/VTT, three sizes),
  stereo or 5.1 audio, skip intro, next episode, resume, progress sync

## Build and install

Requirements: Node 20+, [Tizen Studio CLI](https://developer.tizen.org/development/tizen-studio/download)
with the Samsung Certificate Extension and TV extensions, a Samsung TV in Developer Mode.

1. `npm install`, then create `.env.local` with `VITE_API_KEY=<key>`: the client key the official
   30nama TV web client sends as `c-api-key`. It is not included in this repo.
2. Create a Samsung certificate profile named `30nama` for your TV's DUID in the Tizen
   Certificate Manager (Samsung → TV; sign in with a Samsung account).
3. `scripts/tv.sh <tv-ip>` builds, signs, installs and launches the app with the web inspector.

Desktop development: `npm run dev` (arrow keys, Enter, Backspace as Back, `r` for the debug log).

`TASKS.md` records the API behaviour this app depends on and what is out of scope.
