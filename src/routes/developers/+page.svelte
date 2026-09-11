<script lang="ts">
  import { onDestroy } from "svelte";
  import { pushState } from "$app/navigation";
  import CopyButton from "$lib/components/CopyButton.svelte";
  let copied = "";
  let copyError = "";
  let copyTimer: ReturnType<typeof setTimeout>;
  onDestroy(() => clearTimeout(copyTimer));
  function scrollToSection(event: MouseEvent) {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    const hash = (event.currentTarget as HTMLAnchorElement).hash;
    const section = document.getElementById(hash.slice(1));
    if (!section) return;
    event.preventDefault();
    pushState(hash, {});
    section.focus({ preventScroll: true });
    section.scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
      block: "start",
    });
  }
  const examples = [
    {
      id: "search",
      title: "Search",
      text: "Search track, artist, and album metadata. Results are not ranked by popularity.",
      url: "https://lyrics-api.binimum.org/?q=Paradise",
    },
    {
      id: "isrc",
      title: "ISRC lookup",
      text: "Find lyric files by recording ISRC.",
      url: "https://lyrics-api.binimum.org/?isrc=GBAYE1101143",
    },
    {
      id: "track",
      title: "Track lookup",
      text: "Track and artist are required. Album and duration are optional.",
      url: "https://lyrics-api.binimum.org/?track=Paradise&artist=Coldplay&duration=279&album=Mylo%20Xyloto",
    },
    {
      id: "history",
      title: "History",
      text: "Dated lyric counts. The latest entry may precede today.",
      url: "https://lyrics-api.binimum.org/count?history=true",
    },
  ];
  async function copy(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      copied = id;
      copyError = "";
      clearTimeout(copyTimer);
      copyTimer = setTimeout(() => (copied = ""), 1800);
    } catch {
      copyError = "Copy unavailable. Select the code to copy it manually.";
    }
  }
  const responseExample = JSON.stringify(
    {
      total: 1,
      source: "HIT-LOCAL-LIBSQL",
      results: [
        {
          id: "69b92ef9000ee8938c3c",
          track_name: "Paradise",
          artist_name: "Coldplay",
          album_name: "Mylo Xyloto",
          duration: 279,
          isrc: "GBAYE1101143",
          timing_type: "word",
          lyricsUrl: "https://lyrics-storage.binimum.org/GBAYE1101143.ttml",
        },
      ],
    },
    null,
    2,
  );
</script>

<svelte:head
  ><title>BiniLyrics: for developers</title><meta
    name="description"
    content="Build with the BiniLyrics API. Find synced lyrics by ISRC, track and artist, or free-text search, and retrieve TTML lyric files."
  /></svelte:head
>
<main id="main" class="inner-page">
  <h1>API reference</h1>
  <div class="developer-grid">
    <nav class="docs-nav" aria-label="API documentation">
      {#each [["search", "Search"], ["isrc", "ISRC lookup"], ["track", "Track matching"], ["response", "Response"], ["history", "History"]] as [id, label]}
        <a href={`#${id}`} onclick={scrollToSection}>{label}</a>
      {/each}
    </nav>
    <div class="docs-content">
      {#each examples as example}<section id={example.id} tabindex="-1">
          <h2>{example.title}</h2>
          <p>{example.text}</p>
          <div class="code-block">
            <div class="code-top">
              <span>GET / JSON</span>
            </div>
            <div class="code-body">
              <pre>{example.url}</pre>
              <CopyButton
                copied={copied === example.id}
                onclick={() => copy(example.id, example.url)}
              />
            </div>
          </div>
          {#if example.id === "track"}<table class="docs-table">
              <thead
                ><tr><th>PARAMETER</th><th>REQUIRED</th><th>DESCRIPTION</th></tr
                ></thead
              ><tbody
                ><tr
                  ><td><code>track</code></td><td>Yes</td><td>Track title</td
                  ></tr
                ><tr
                  ><td><code>artist</code></td><td>Yes</td><td>Artist name</td
                  ></tr
                ><tr
                  ><td><code>duration</code></td><td>No</td><td
                    >Duration in seconds</td
                  ></tr
                ><tr
                  ><td><code>album</code></td><td>No</td><td>Album title</td
                  ></tr
                ></tbody
              >
            </table>{/if}
        </section>{/each}
      <section id="response" tabindex="-1">
        <h2>Response</h2>
        <p>
          Search and lookup endpoints share the same response shape. Each result
          points to a TTML file. Use <code>timing_type</code> to distinguish word-level
          from line-level timing.
        </p>
        <div class="code-block">
          <div class="code-top">
            <span>EXAMPLE RESPONSE</span>
            <CopyButton
              label="Copy JSON"
              copied={copied === "response"}
              onclick={() => copy("response", responseExample)}
            />
          </div>
          <pre>{responseExample}</pre>
        </div>
        <p class="notice">
          A catalogue match may return multiple versions, or no lyrics. Handle
          an empty <code>results</code> array and temporary service errors in your
          application.
        </p>
      </section>
      {#if copyError}<p role="status">{copyError}</p>{/if}
      <span class="visually-hidden" role="status"
        >{copied ? "Copied to clipboard" : ""}</span
      >
    </div>
  </div>
</main>

<style>
  .code-body {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .code-body pre {
    flex: 1;
    min-width: 0;
  }
</style>
