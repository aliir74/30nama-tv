# 30nama TV (Tizen) — task checklist

Samsung Tizen web app (.wgt) for 30nama.com. Target: 2022+ TVs (Tizen 6.5+, Chromium 85+).
Scope: full parity with the official Android TV app, no payments.

## API facts (verified 2026-10-10)

- **Base (primary):** `https://interface.30nama.com/api/v1/action/<path>`. Works from any client, no
  Cloudflare challenge. CORS `*`. POST, form-urlencoded body.
- Headers: `c-api-key` (web key, from the 30nama.com bundle), `c-app-version: 2.0.0`,
  `c-platform: Website`, `c-useragent`, `c-token` (session, after login).
- **v2 (official TV client, `tv.30app.store`):** `https://world.hana-api.com/api/v2/action/<name>`,
  its own client key, headers `c-version-number: 1.2.0`, `c-language: fa`. Behind a Cloudflare managed
  challenge for non-browser clients; may or may not pass from the Tizen runtime. Not used yet.
- Endpoint discovery list for v2: `pub-ac69cf865ce145f8b4c1ed87dc2a9fb7.r2.dev/sdk-endpoint.json`.
- Login on TV = QR: `qrcode/` returns `{code,url}`; user opens `30nama.com/auth/<code>` on a
  logged-in device; TV polls `qrlogin/code/<code>` every 5s.
- Password login needs reCAPTCHA, so it is not offered on TV.
- Official TV player: JW Player, HLS (`file.m3u8[quality]`), subtitles, `intro_start/intro_end`,
  progress reported via `observer` every 30s.
- Response guards: `REQUESTBLOCK`, `REQUESTCAPTCHA`, `APIMAINTENANCE` strings mean stop and show
  a message; never retry-storm.
- Endpoint map (v2 actions): see `src/api/endpoints.ts`.
- v2 gotchas: `continue_watching[].id` is the post id; the episode and position come from
  `stream.continue_watching.{file_id,time}`. `observer` answers 204 with no body.
- QR login result (v1): `{usertoken, userid, allowed_to_stream, allowed_to_download, usertype,
  expire, username, useremail, avatar}`. `usertype` came back `UnKnown` and `expire` `-` for an
  active account, so the profile screen must not rely on them.
- v1 tokens are rejected by v2 (`Access Denied`); each API has its own session.
- **Stream (v1 `stream/id/<id>`):** movie → `{data, file:{url, source:[{label, auto, 2ch, 6ch}]},
  subtitle:{fa, en}, options:{intro_start, intro_end, key}, watched, image, vast2}`. Series →
  `{data, list:{<season>:[{data:{id, season, number, title}, file, subtitle, options:{intro_*,
  previously_*, end, key}}]}, watched, image}`. Sources: auto, 1080p … 240p.
- Media: VOD HLS master (`application/x-mpegURL`, CORS `*`), 240p–1080p variants, separate
  2ch/6ch audio groups, absolute signed `.ts` segment URLs. No headers needed. URLs embed the
  requesting IP and user id and expire, so the TV must fetch its own links; no proxy.
- **Subtitles (v1):** SRT on `subtitle.30nama.com`, behind a Cloudflare managed challenge for curl
  and for automated Chrome. The official TV app (React Native, v2 API) fetches subtitles from the
  stream storage hosts instead and parses them in-app (`subtitles-parser-vtt`).
  Plan: SRT→VTT in-app; tiers (a) v2 or direct fetch verified on the TV, (b) subsource links from
  `single.subtitle`, (c) subtitles off. Ship (c) first.

## Checklist

### 0. Discovery
- [x] Find live API base, key and headers
- [x] Confirm QR login flow anonymously
- [x] Get a session token (QR login on a real account) and record `stream/id` shape (`get_hls` → Access Denied)
- [x] Confirm the HLS URL plays from outside Iran and how auth is carried (signed URL, no headers)
- [x] Confirm subtitle format (SRT)
- [x] Capture v2 `stream` shape and its subtitle host (WebVTT via `/action/subtitle/file/<b64>`)
- [x] Decide API: **v2 only** (official TV client). v1 code removed. Open question: does the Tizen
      runtime pass Cloudflare on `world.hana-api.com` from a `file://` origin? Plan B: hosted shell
      (`<content src="https://…">`), then v1 for video only.

### 1. Foundation
- [x] Vite build for Chromium 85, relative base, Tizen `config.xml`, icon
- [x] Vazirmatn bundled (FD digits for Persian, Latin digits for English titles), RTL, 1920x1080
- [x] API client (v2): headers, form body, Cloudflare detection, 204 handling, bounded retry
- [x] Spatial navigation (norigin, rtl), Tizen key registration, Back key handling
- [x] Screen stack + on-screen debug log (Red key / `r`)
- [x] Side menu (rail on every top-level screen; widens with labels while focused)

### API facts added 2026-10-10 (all probed from the TV runtime)
- `streamonly` must be the string `"true"`; `1` is ignored and unplayable titles come back.
- `archive`/`advanced_search` `orderby`: `relevant` and `year` change results; `imdb`/`date` don't.
- `advanced_search` list fields take arrays (`genre: ["drama"]`); scalars for `imdb_rate`,
  `min_year`, `max_year`, `stream: "true"`; people via `actor`/`director` (not `cast`).
- `user_list` with `action=add` toggles (second call removes). `user_list_toggle` is only the
  SDK's method name; the action itself 404s.

### 2. Screens (parity)
- [x] QR login + account check (`user`)
- [x] Home (hero, continue watching, rows from `home_stream`)
- [x] Title detail: movie and series (seasons, episodes, cast, scores), watchlist/favorite toggle,
      cast and director chips. Rating: no v2 action, not in the official TV client
- [x] Player: HLS (hls.js), quality, fa/en/off subtitles, skip intro, next episode, resume,
      `observer` progress (verified on server), media keys, subtitle size, stereo/5.1 audio,
      start quality (settings). Starts at 1080p: `abrEwmaDefaultEstimate` 5 Mbps
- [x] Search with on-screen fa/en/digit keyboard; results refresh as you type (min 3 letters:
      the server rejects shorter queries)
- [x] Browse: categories and genres from `menu`, lists via `archive`, advanced filters (type,
      genre, IMDb, decade, country) via `advanced_search`
- [x] My list: watchlist, favorites, continue watching with a play/details/dismiss sheet.
      After a fresh `observer` report, `continue_watching_dismiss` answers DISMISS_SUCCESS but
      the entry can stay in the list for several minutes before it drops out.
      `stream_watched` history: no v2 action; continue watching is the history
- [-] Collections, top lists, box office, release schedule: no v2 action and not in the official
      TV client (only v1 has them). `home` has `new_releases` and `top_10` rows if wanted later
- [x] Person page: `advanced_search` with `actor`/`director` = IMDb id (a name matches any word)
- [-] Comments: no v2 action, not in the official TV client
- [x] Notifications (mark read on open; account had none, so items are untested live),
      profile (plan, days left), settings, logout with confirm

### 3. Ship
- [x] Tizen CLI 6.1 (`~/tizen-studio`), Samsung certificate profile `30nama` for the TV's DUID
- [x] Package `.wgt`, install via `sdb`/`tizen install`, smoke test on the TV
      (packaged + installed 2026-10-10; QR login renders from v2 on the TV, so Cloudflare passes
      from `file://`. Debug: `sdb shell 0 debug SiNamaTV01.SiNamaTV`, then CDP on
      `<tv-ip>:<port>` directly; sdb forward to localhost does not answer)
      Smoke test on the TV: QR login, home rows, play from hero, hls.js loads 1080p segments,
      fa SRT cues render in sync, Back exits, `observer` moves the title to continue watching.
      The 426x178 report came from starting at 240p; with the 5 Mbps estimate it opens at
      1920x804 (1080p). Pinned 720p + 5.1 verified (720p.m3u8, 192k-6.m3u8).
      CDP screenshots cannot see the video plane (white frame).
- [x] Before/after screenshots + screen recording
- [x] Public GitHub repo
