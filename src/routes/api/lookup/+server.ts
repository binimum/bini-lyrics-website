import { error, json } from "@sveltejs/kit";
import { upstream } from "$lib/server/api";
import { searchParams } from "$lib/search";
import type { RequestHandler } from "./$types";
export const GET: RequestHandler = async ({ url, fetch }) => {
  let params: URLSearchParams;
  try {
    params = searchParams(url.searchParams);
  } catch (cause) {
    error(400, (cause as Error).message);
  }
  const response = await upstream(
    new URL(`https://lyrics-api.binimum.org/?${params}`),
    fetch,
  );
  const data = await response.json();
  if (!Array.isArray(data.results))
    error(502, "The lyrics service returned an unexpected response.");
  return json(data);
};
