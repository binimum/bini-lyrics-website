import { error, json } from "@sveltejs/kit";
import { appleRequest } from "$lib/server/apple";
import { normalizeSong, type AppleSong } from "$lib/apple";
import type { RequestHandler } from "./$types";
export const GET: RequestHandler = async ({ url }) => {
  const term = url.searchParams.get("q")?.trim();
  const offset = Number(url.searchParams.get("offset") ?? 0);
  if (
    !term ||
    term.length > 300 ||
    !Number.isInteger(offset) ||
    offset < 0 ||
    offset > 1000
  )
    error(400, "Enter a search between 1 and 300 characters.");
  try {
    const data = await appleRequest(
      "search",
      new URLSearchParams({
        term,
        types: "songs",
        limit: "20",
        offset: String(offset),
        l: "en-US",
        with: "lyricHighlights,lyrics",
      }),
    );
    const songs = data.results?.songs;
    return json({
      provider: "apple",
      source: "Apple Music",
      total: songs?.data?.length ?? 0,
      results: (songs?.data ?? []).map((song: AppleSong) =>
        normalizeSong(song),
      ),
      nextOffset: songs?.next ? offset + 20 : undefined,
    });
  } catch (cause) {
    error(
      502,
      cause instanceof Error ? cause.message : "Music search is unavailable.",
    );
  }
};
