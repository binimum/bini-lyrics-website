# BiniLyrics

A SvelteKit / Svelte 5 / TypeScript website for discovering songs and reading synced lyrics.

## Run

```sh
npm install
npm run dev
```

Validation: `npm run check`, `npm test`, `npm run build`.

## Data flow

- `/api/suggestions` requests terms and song suggestions from `https://api.music.apple.com/v1/catalog/us/search/suggestions`, debounced by 250 ms in the browser.
- `/api/search` discovers songs through `https://api.music.apple.com/v1/catalog/us/search`, with lyric snippets, artwork, ISRCs, and pagination. It only labels `meta.snippets` of kind `lyric` as lyric matches.
- Credentials come from `https://am-mint.binimum.org/token` on the server. Token fetches are coalesced, cached below the supplied TTL (capped at 120 seconds), and refreshed once after a 401/403. Tokens never enter client responses or source code. Only the official Apple Music API host is used. The catalog defaults to US; the mint's numeric storefront header is not an ISO country code.
- Opening a discovery result uses its ISRC with `https://lyrics-api.binimum.org/?isrc=...`. Multiple files can be selected in the reader. Track/artist and ISRC tabs also allow direct BiniLyrics lookup.
- `/api/lyrics` fetches TTML only from `https://lyrics-storage.binimum.org`. Lyric text is parsed with the browser's XML parser and rendered as text, never HTML. The reader displays timing; it does not play audio.
- `/api/history` refreshes the collection count. The user-supplied history is a clearly dated fallback snapshot, not a fabricated live count.

`adapter-auto` supports detected SvelteKit deployment platforms. A server runtime and outbound HTTPS to the above hosts are required; this isn't a static-only export. Configure a platform-specific adapter for other targets. No deployment is performed by this repository.

Design: Funnel Sans headings, DM Sans body text, and IBM Plex Mono for compact metadata. Kawarp renders the fluid WebGL background beneath translucent, blurred glass surfaces, with a gradient fallback. Motion stops for reduced-motion preferences and hidden tabs. The centered search sits above a compact graph and developer link; a persistent theme toggle lives at the bottom right. CSS provides opaque fallbacks when backdrop filtering is unavailable. Results retain list and cover views; the responsive song reader keeps Apple artwork and release metadata alongside BiniLyrics.
