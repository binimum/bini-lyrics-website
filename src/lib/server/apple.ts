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
  ) => {
    const url = new URL(`https://api.music.apple.com/v1/catalog/us/${path}`);
    url.search = params.toString();
    for (let attempt = 0; attempt < 2; attempt++) {
      const credential = await token();
      const response = await fetcher(url, {
        redirect: "error",
        headers: {
          Authorization: `Bearer ${credential.token}`,
          Origin: "https://music.apple.com",
        },
        signal: AbortSignal.timeout(12000),
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
