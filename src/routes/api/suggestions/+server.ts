import { error, json } from "@sveltejs/kit";
import { appleRequest } from "$lib/server/apple";
import { normalizeSuggestions } from "$lib/apple";
import type { RequestHandler } from "./$types";
export const GET: RequestHandler = async ({ url }) => {
  const term = url.searchParams.get("q")?.trim();
  if (!term || term.length < 2) return json({ suggestions: [] });
  if (term.length > 300) error(400, "Search is too long.");
  try {
    const data = await appleRequest(
      "search/suggestions",
      new URLSearchParams({
        term,
        kinds: "terms,topResults",
        types: "songs",
        limit: "5",
        l: "en-US",
        with: "lyricHighlights,lyrics",
      }),
    );
    return json({ suggestions: normalizeSuggestions(data) });
  } catch (cause) {
    error(
      502,
      cause instanceof Error ? cause.message : "Suggestions are unavailable.",
    );
  }
};
