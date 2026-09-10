export type Track = {
  id: string;
  track_name: string;
  artist_name: string;
  album_name: string;
  duration: number;
  isrc: string;
  timing_type: string;
  lyricsUrl: string;
  artwork?: string;
  artworkLarge?: string;
  releaseDate?: string;
  genres?: string[];
  explicit?: boolean;
  appleUrl?: string;
  provider?: string;
  lyricSnippet?: string;
};
export type SearchResult = {
  total: number;
  source: string;
  results: Track[];
  nextOffset?: number;
  provider?: string;
};
export type HistoryPoint = { date: string; count: number };
export const number = (value: number) =>
  new Intl.NumberFormat("en-US").format(value);
export function duration(value: number) {
  return `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, "0")}`;
}
export function dateLabel(value: string) {
  return new Date(`${value}T12:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
