<script lang="ts">
  let copied = "";
  let copyError = "";
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
  ><title>For developers — BiniLyrics</title><meta
    name="description"
    content="Build with the BiniLyrics API. Find synced lyrics by ISRC, track and artist, or free-text search, and retrieve TTML lyric files."
  /></svelte:head
>
<main id="main" class="inner-page">
  <h1>API reference</h1>
  <div class="developer-grid">
    <nav class="docs-nav" aria-label="API documentation">
      <a href="#search">Search</a><a href="#isrc">ISRC lookup</a><a
        href="#track">Track matching</a
      ><a href="#response">Response</a><a href="#history">History</a>
    </nav>
    <div class="docs-content">
      {#each examples as example}<section id={example.id}>
          <h2>{example.title}</h2>
          <p>{example.text}</p>
          <div class="code-block">
            <div class="code-top">
              <span>GET / JSON</span><button
                onclick={() => copy(example.id, example.url)}
                >{copied === example.id ? "Copied ✓" : "Copy URL"}</button
              >
            </div>
            <pre>{example.url}</pre>
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
      <section id="response">
        <h2>Response</h2>
        <p>
          Search and lookup endpoints share the same response shape. Each result
          points to a TTML file. Use <code>timing_type</code> to distinguish word-level
          from line-level timing.
        </p>
        <div class="code-block">
          <div class="code-top">
            <span>EXAMPLE RESPONSE</span><button
              onclick={() => copy("response", responseExample)}
              >{copied === "response" ? "Copied ✓" : "Copy JSON"}</button
            >
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
    </div>
  </div>
</main>
