import type { Track } from "./types.ts";
export type AppleSong = {
  id: string;
  type: string;
  attributes?: {
    name?: string;
    artistName?: string;
    albumName?: string;
    durationInMillis?: number;
    isrc?: string;
    artwork?: { url: string };
    url?: string;
    releaseDate?: string;
    genreNames?: string[];
    contentRating?: string;
  };
  meta?: { snippets?: { kind: string; text: string }[] };
};
export type Suggestion =
  { kind: "term"; term: string } | { kind: "song"; song: Track };
export function normalizeSong(song: AppleSong): Track {
  const a = song.attributes ?? {};
  const rawArtwork = a.artwork?.url ?? "";
  let artwork = "";
  let artworkLarge = "";
  try {
    const url = new URL(rawArtwork);
    if (url.protocol === "https:" && url.hostname.endsWith(".mzstatic.com")) {
      artwork = rawArtwork.replace("{w}", "160").replace("{h}", "160");
      artworkLarge = rawArtwork.replace("{w}", "800").replace("{h}", "800");
    }
  } catch {
    /* Artwork is optional. */
  }
  return {
    id: song.id,
    track_name: a.name ?? "Untitled",
    artist_name: a.artistName ?? "Unknown artist",
    album_name: a.albumName ?? "",
    duration: (a.durationInMillis ?? 0) / 1000,
    isrc: a.isrc ?? "",
    timing_type: "",
    lyricsUrl: "",
    artwork,
    artworkLarge,
    releaseDate: a.releaseDate,
    genres: a.genreNames?.filter((genre) => genre !== "Music"),
    explicit: a.contentRating === "explicit",
    appleUrl: a.url,
    provider: "apple",
    lyricSnippet: song.meta?.snippets?.find((s) => s.kind === "lyric")?.text,
  };
}
export function normalizeSuggestions(data: {
  results?: {
    suggestions?: { kind: string; searchTerm?: string; content?: AppleSong }[];
  };
}): Suggestion[] {
  return (data.results?.suggestions ?? []).flatMap<Suggestion>((s) =>
    s.kind === "terms" && s.searchTerm
      ? [{ kind: "term", term: s.searchTerm }]
      : s.kind === "topResults" && s.content?.type === "songs"
        ? [{ kind: "song", song: normalizeSong(s.content) }]
        : [],
  );
}
