import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeSong, normalizeSuggestions } from "../src/lib/apple.ts";
import { createAppleClient } from "../src/lib/server/apple.ts";
import { searchParams } from "../src/lib/search.ts";
const song = {
  id: "123",
  type: "songs",
  attributes: {
    name: "Example",
    artistName: "Artist",
    isrc: "USCM51600028",
    durationInMillis: 173985,
    releaseDate: "2016-04-05",
    genreNames: ["Hip-Hop/Rap", "Music"],
    contentRating: "explicit",
    artwork: { url: "https://is1-ssl.mzstatic.com/a/{w}x{h}bb.jpg" },
  },
  meta: { snippets: [{ kind: "lyric", text: "A matching line" }] },
};
test("song normalization keeps ISRC, duration, artwork and actual lyric matches", () => {
  const normalized = normalizeSong(song);
  assert.equal(normalized.isrc, "USCM51600028");
  assert.equal(normalized.duration, 173.985);
  assert.equal(normalized.lyricSnippet, "A matching line");
  assert.equal(
    normalized.artwork,
    "https://is1-ssl.mzstatic.com/a/160x160bb.jpg",
  );
  assert.equal(
    normalized.artworkLarge,
    "https://is1-ssl.mzstatic.com/a/800x800bb.jpg",
  );
  assert.equal(normalized.releaseDate, "2016-04-05");
  assert.deepEqual(normalized.genres, ["Hip-Hop/Rap"]);
  assert.equal(normalized.explicit, true);
  assert.equal(normalized.lyricsUrl, "");
  assert.equal(
    normalizeSong({ ...song, meta: undefined }).lyricSnippet,
    undefined,
  );
  assert.equal(
    normalizeSong({
      ...song,
      meta: { snippets: [{ kind: "description", text: "Not a lyric match" }] },
    }).lyricSnippet,
    undefined,
  );
});
test("autocomplete preserves terms and song metadata, excludes non-song resources", () => {
  const data = normalizeSuggestions({
    results: {
      suggestions: [
        { kind: "terms", searchTerm: "example" },
        { kind: "topResults", content: song },
        { kind: "topResults", content: { id: "2", type: "albums" } },
      ],
    },
  });
  assert.equal(data.length, 2);
  assert.deepEqual(data[0], { kind: "term", term: "example" });
  assert.equal(data[1].kind === "song" && data[1].song.isrc, "USCM51600028");
});
test("coalesces token requests, respects TTL and only calls the official music host", async () => {
  let now = 1000;
  let mints = 0;
  let searches = 0;
  const fetcher = (async (input: RequestInfo | URL) => {
    const url = new URL(String(input));
    if (url.hostname === "am-mint.binimum.org") {
      mints++;
      await new Promise((resolve) => setTimeout(resolve, 10));
      return Response.json({
        token: "test-token",
        token_type: "Bearer",
        cache_ttl_seconds: 120,
      });
    }
    assert.equal(url.hostname, "api.music.apple.com");
    searches++;
    return Response.json({ results: {} });
  }) as typeof fetch;
  const client = createAppleClient(fetcher, () => now);
  await Promise.all([
    client("search", new URLSearchParams()),
    client("search/suggestions", new URLSearchParams()),
  ]);
  assert.equal(mints, 1);
  assert.equal(searches, 2);
  now += 114000;
  await client("search", new URLSearchParams());
  assert.equal(mints, 1);
  now += 2000;
  await client("search", new URLSearchParams());
  assert.equal(mints, 2);
});
test("refreshes rejected tokens once and does not loop on authorization failure", async () => {
  let mints = 0;
  let requests = 0;
  const client = createAppleClient((async (input: RequestInfo | URL) => {
    if (String(input).includes("am-mint")) {
      mints++;
      return Response.json({
        token: "test",
        token_type: "Bearer",
        cache_ttl_seconds: 120,
      });
    }
    requests++;
    return new Response("", { status: 401 });
  }) as typeof fetch);
  await assert.rejects(
    client("search", new URLSearchParams()),
    /temporarily unavailable/,
  );
  assert.equal(mints, 2);
  assert.equal(requests, 2);
});
test("ISRC and precise lookup validates and preserves parameters", () => {
  assert.equal(
    searchParams(new URLSearchParams({ isrc: "gb-aye-11-01143" })).get("isrc"),
    "GBAYE1101143",
  );
  assert.throws(() => searchParams(new URLSearchParams({ isrc: "broken" })));
  assert.throws(() => searchParams(new URLSearchParams({ track: "Paradise" })));
  assert.throws(() =>
    searchParams(
      new URLSearchParams({
        track: "Paradise",
        artist: "Coldplay",
        duration: "-1",
      }),
    ),
  );
  const params = searchParams(
    new URLSearchParams({
      track: "Paradise",
      artist: "Coldplay",
      album: "Mylo Xyloto",
      duration: "279",
    }),
  );
  assert.equal(params.get("album"), "Mylo Xyloto");
  assert.equal(params.get("duration"), "279");
});
