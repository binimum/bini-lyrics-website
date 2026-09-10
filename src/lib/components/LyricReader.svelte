<script lang="ts">
  import TimingIcon from "./TimingIcon.svelte";
  const timingLabel = (type: string) =>
    type === "word" ? "Word" : type === "line" ? "Line" : "Plain";
  import { onMount } from "svelte";
  import type { Track } from "$lib/types";
  import { duration } from "$lib/types";
  import Icon from "./Icon.svelte";
  export let track: Track;
  export let onclose: () => void;
  let dialog: HTMLDialogElement;
  let lines: { text: string; time: string }[] = [];
  let busy = true;
  let error = "";
  let copied = false;
  let copyError = "";
  let matches: Track[] = [];
  let lyricTrack: Track | undefined =
    track.provider === "apple" ? undefined : track;
  let controller: AbortController;
  async function load(lookup = true) {
    controller?.abort();
    const current = new AbortController();
    controller = current;
    busy = true;
    error = "";
    try {
      if (track.provider === "apple" && lookup) {
        if (!track.isrc)
          throw new Error(
            "Apple Music has no ISRC for this song. Try another recording.",
          );
        const lookupResponse = await fetch(
          `/api/lookup?${new URLSearchParams({ isrc: track.isrc })}`,
          { signal: current.signal },
        );
        if (!lookupResponse.ok)
          throw new Error(
            "The lyrics lookup is unavailable. Please try again.",
          );
        const data = await lookupResponse.json();
        matches = data.results;
        lyricTrack =
          matches.find((t) => t.timing_type === "word") ?? matches[0];
        if (!lyricTrack)
          throw new Error(
            "This recording isn’t in the BiniLyrics collection yet. Try another version of the song.",
          );
      }
      if (!lyricTrack) throw new Error("No lyric file is available.");
      const response = await fetch(
        `/api/lyrics?${new URLSearchParams({ url: lyricTrack.lyricsUrl })}`,
        { signal: current.signal },
      );
      if (!response.ok)
        throw new Error("We couldn’t load these lyrics. Please try again.");
      const xml = new DOMParser().parseFromString(
        await response.text(),
        "application/xml",
      );
      if (xml.querySelector("parsererror"))
        throw new Error(
          "This lyric file could not be read. You can still open the original TTML.",
        );
      lines = Array.from(xml.getElementsByTagNameNS("*", "p"))
        .map((p) => ({
          text: (p.textContent ?? "").replace(/\s+/g, " ").trim(),
          time: p.getAttribute("begin") ?? "",
        }))
        .filter((p) => p.text);
      if (!lines.length)
        throw new Error("No readable lyric lines were found in this file.");
    } catch (cause) {
      if (controller === current && (cause as Error).name !== "AbortError")
        error = (cause as Error).message;
    } finally {
      if (controller === current) busy = false;
    }
  }
  onMount(() => {
    dialog.showModal();
    load();
    return () => controller?.abort();
  });
  async function copy() {
    try {
      await navigator.clipboard.writeText(lines.map((p) => p.text).join("\n"));
      copied = true;
      copyError = "";
    } catch {
      copyError =
        "Copy is unavailable in this browser. Select the lyrics to copy them.";
    }
  }
</script>

<dialog
  bind:this={dialog}
  class="reader"
  aria-labelledby="reader-title"
  {onclose}
  onclick={(event) => {
    if (event.target === dialog) dialog.close();
  }}
  onkeydown={(event) => {
    if (event.key === "Escape") dialog.close();
  }}
>
  <div class="reader-top">
    <button
      class="icon-button"
      aria-label="Close lyric reader"
      onclick={() => dialog.close()}><Icon name="close" /></button
    >
  </div>
  <div class="reader-inner">
    <aside class="release-panel">
      <div class="release-artwork">
        {#if track.artwork}<img
            src={track.artworkLarge || track.artwork}
            alt={`${track.album_name} album cover`}
            width="800"
            height="800"
          />{:else}<div class="cover-placeholder">
            <Icon name="note" size={80} />
          </div>{/if}
      </div>
      <h2 id="reader-title">{track.track_name}</h2>
      <p class="reader-artist">{track.artist_name}</p>
      <dl class="release-details">
        <div>
          <dt>ALBUM</dt>
          <dd>{track.album_name || "Not provided"}</dd>
        </div>
        {#if track.releaseDate}<div>
            <dt>RELEASED</dt>
            <dd>{track.releaseDate}</dd>
          </div>{/if}
        <div>
          <dt>DURATION</dt>
          <dd>
            {duration(track.duration)}{#if track.explicit}<span
                class="explicit-badge">EXPLICIT</span
              >{/if}
          </dd>
        </div>
        {#if track.genres?.length}<div>
            <dt>GENRE</dt>
            <dd>{track.genres.join(" / ")}</dd>
          </div>{/if}
        <div>
          <dt>ISRC</dt>
          <dd>{track.isrc || "Unavailable"}</dd>
        </div>
      </dl>
      {#if track.appleUrl}<a
          class="apple-link"
          href={track.appleUrl}
          target="_blank"
          rel="noreferrer"
          >Open in Apple Music <Icon name="diagonal" size={18} /></a
        >{/if}
    </aside>
    <section class="lyrics-panel" aria-label="Song lyrics">
      <div class="lyrics-panel-top">
        <div>
          <h3>Lyrics</h3>
        </div>
        {#if lyricTrack}<span class="timing"
            ><TimingIcon type={lyricTrack.timing_type} />{timingLabel(
              lyricTrack.timing_type,
            )}</span
          >{/if}
      </div>
      <div class="reader-actions">
        {#if lyricTrack}<a
            class="small-button"
            href={lyricTrack.lyricsUrl}
            target="_blank"
            rel="noreferrer">Open TTML <Icon name="diagonal" size={16} /></a
          >{/if}<button
          class="small-button"
          disabled={busy || !!error}
          onclick={copy}
          ><Icon name={copied ? "check" : "copy"} size={16} />{copied
            ? "Copied"
            : "Copy lyrics"}</button
        >
      </div>
      {#if matches.length > 1}<label class="version-select"
          >Lyric version<select
            onchange={(event) => {
              lyricTrack = matches.find(
                (t) => t.id === event.currentTarget.value,
              );
              copied = false;
              load(false);
            }}
            value={lyricTrack?.id}
            >{#each matches as match}<option value={match.id}
                >{match.track_name} · {timingLabel(match.timing_type)} · {duration(
                  match.duration,
                )}</option
              >{/each}</select
          ></label
        >{/if}
      {#if copyError}<p role="status">{copyError}</p>{/if}
      <div class="lyric-lines" aria-live="polite">
        {#if busy}<div class="lyric-loading">
            <Icon name="bars" size={28} />
            <p>Loading lyrics…</p>
          </div>{:else if error}<div class="reader-error">
            <p>{error}</p>
            <button class="small-button" onclick={() => load()}
              >Try again <Icon name="arrow" size={16} /></button
            >
          </div>{:else}{#each lines as line, i}<div class="lyric-line">
              <span class="lyric-time"
                >{line.time || String(i + 1).padStart(2, "0")}</span
              >
              <p>{line.text}</p>
            </div>{/each}{/if}
      </div>
    </section>
  </div>
</dialog>
