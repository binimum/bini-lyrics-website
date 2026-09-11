import {
  normalizeSong,
  normalizeSuggestions,
  type AppleSong,
} from "./apple.ts";
import type { SearchResult } from "./types.ts";

type Token = { token: string; expiresAt: number };
export function createAppleClient(
  fetcher: typeof fetch = fetch,
  now: () => number = Date.now,
) {
  let cached: Token | undefined;
  let pending: Promise<Token> | undefined;
  async function token(): Promise<Token> {
    if (cached && cached.expiresAt > now()) return cached;
    if (!pending)
      pending = (async () => {
        const response = await fetcher("https://am-mint.binimum.org/token", {
          signal: AbortSignal.timeout(10000),
        });
        if (!response.ok)
          throw new Error(
            "Music search authentication is temporarily unavailable.",
          );
        const data = await response.json();
        if (
          typeof data.token !== "string" ||
          !data.token ||
          data.token_type !== "Bearer"
        )
          throw new Error(
            "Music search authentication returned an invalid response.",
          );
        const ttl =
          typeof data.cache_ttl_seconds === "number" &&
          Number.isFinite(data.cache_ttl_seconds)
            ? Math.max(0, Math.min(data.cache_ttl_seconds, 120))
            : 0;
        // The mint storefront_id is a numeric store header, not a catalog country code.
        cached = {
          token: data.token,
          expiresAt: now() + Math.max(0, ttl - 5) * 1000,
        };
        return cached;
      })().finally(() => {
        pending = undefined;
      });
    return pending;
  }
  return async (
    path: "search" | "search/suggestions",
    params: URLSearchParams,
    signal?: AbortSignal,
  ) => {
    const url = new URL(`https://api.music.apple.com/v1/catalog/us/${path}`);
    url.search = params.toString();
    for (let attempt = 0; attempt < 2; attempt++) {
      signal?.throwIfAborted();
      const credential = await token();
      signal?.throwIfAborted();
      const response = await fetcher(url, {
        redirect: "error",
        headers: {
          Authorization: `Bearer ${credential.token}`,
        },
        signal: signal
          ? AbortSignal.any([signal, AbortSignal.timeout(12000)])
          : AbortSignal.timeout(12000),
      });
      if (
        (response.status === 401 || response.status === 403) &&
        attempt === 0
      ) {
        if (cached === credential) cached = undefined;
        continue;
      }
      if (!response.ok)
        throw new Error(
          response.status === 429
            ? "Music search is busy. Please try again shortly."
            : "Apple Music search is temporarily unavailable. Please try again.",
        );
      return response.json();
    }
    throw new Error("Music search authentication failed.");
  };
}
export const appleRequest = createAppleClient();

export async function searchApple(
  query: string,
  offset = 0,
  signal?: AbortSignal,
): Promise<SearchResult> {
  const term = query.trim();
  if (
    !term ||
    term.length > 300 ||
    !Number.isInteger(offset) ||
    offset < 0 ||
    offset > 1000
  )
    throw new Error("Enter a search between 1 and 300 characters.");
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
    signal,
  );
  const songs = data.results?.songs;
  return {
    provider: "apple",
    source: "Apple Music",
    total: songs?.data?.length ?? 0,
    results: (songs?.data ?? []).map((song: AppleSong) => normalizeSong(song)),
    nextOffset: songs?.next ? offset + 20 : undefined,
  };
}

export async function suggestApple(query: string, signal?: AbortSignal) {
  const term = query.trim();
  if (term.length < 2) return [];
  if (term.length > 300) throw new Error("Search is too long.");
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
    signal,
  );
  return normalizeSuggestions(data);
}
