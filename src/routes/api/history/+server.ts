import { error, json } from "@sveltejs/kit";
import { upstream } from "$lib/server/api";
import type { RequestHandler } from "./$types";
export const GET: RequestHandler = async ({ fetch }) => {
  const response = await upstream(
    new URL("https://lyrics-api.binimum.org/count?history=true"),
    fetch,
  );
  let data = await response.json();
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      error(502, "Invalid catalogue history.");
    }
  }
  if (
    !Array.isArray(data) ||
    !data.length ||
    !data.every(
      (p) =>
        /^\d{4}-\d{2}-\d{2}$/.test(p.date) &&
        Number.isFinite(p.count) &&
        p.count >= 0,
    )
  )
    error(502, "Invalid catalogue history.");
  return json(
    data.sort((a, b) => b.date.localeCompare(a.date)),
    { headers: { "Cache-Control": "public, max-age=300" } },
  );
};
