import { error } from "@sveltejs/kit";
export async function upstream(url: URL, fetcher: typeof fetch) {
  try {
    const response = await fetcher(url, { signal: AbortSignal.timeout(12000) });
    if (!response.ok)
      error(
        response.status === 429 ? 429 : 502,
        response.status === 429
          ? "Too many requests. Please try again shortly."
          : "The lyrics service is temporarily unavailable. Please try again.",
      );
    return response;
  } catch (cause) {
    if (cause && typeof cause === "object" && "status" in cause) throw cause;
    error(502, "The lyrics service could not be reached. Please try again.");
  }
}
