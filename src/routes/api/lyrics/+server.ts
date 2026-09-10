import { error } from "@sveltejs/kit";
import { upstream } from "$lib/server/api";
import type { RequestHandler } from "./$types";
export const GET: RequestHandler = async ({ url, fetch }) => {
  let target: URL;
  try {
    target = new URL(url.searchParams.get("url") ?? "");
  } catch {
    error(400, "Invalid lyrics URL.");
  }
  if (
    target.origin !== "https://lyrics-storage.binimum.org" ||
    target.username ||
    target.password ||
    !target.pathname.endsWith(".ttml")
  )
    error(400, "Unsupported lyrics URL.");
  const response = await upstream(target, fetch);
  return new Response(await response.text(), {
    headers: {
      "Content-Type": "application/ttml+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
