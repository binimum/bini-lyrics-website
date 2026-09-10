export function searchParams(input: URLSearchParams): URLSearchParams {
  const output = new URLSearchParams();
  if (input.has("isrc")) {
    const isrc = (input.get("isrc") ?? "")
      .trim()
      .toUpperCase()
      .replace(/-/g, "");
    if (!/^[A-Z]{2}[A-Z0-9]{3}\d{7}$/.test(isrc))
      throw new Error("Enter a valid 12-character ISRC, such as GBAYE1101143.");
    output.set("isrc", isrc);
  } else if (input.has("track")) {
    for (const key of ["track", "artist"]) {
      const value = (input.get(key) ?? "").trim();
      if (!value) throw new Error("Enter both a track title and an artist.");
      output.set(key, value);
    }
    const album = input.get("album")?.trim();
    if (album) output.set("album", album);
    const duration = input.get("duration")?.trim();
    if (duration) {
      if (!Number.isFinite(Number(duration)) || Number(duration) <= 0)
        throw new Error("Duration must be a positive number of seconds.");
      output.set("duration", duration);
    }
  } else {
    const query = (input.get("q") ?? "").trim();
    if (!query) throw new Error("Enter a song, artist, or album to search.");
    output.set("q", query);
  }
  if ([...output.values()].some((value) => value.length > 300))
    throw new Error("Please keep each search field under 300 characters.");
  return output;
}
