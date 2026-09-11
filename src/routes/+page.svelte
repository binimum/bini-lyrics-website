<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { replaceState } from "$app/navigation";
  import TimingIcon from "$lib/components/TimingIcon.svelte";
  import Icon from "$lib/components/Icon.svelte";
  import SearchForm from "$lib/components/SearchForm.svelte";
  import SearchCarousel from "$lib/components/SearchCarousel.svelte";
  import LyricReader from "$lib/components/LyricReader.svelte";
  import snapshot from "$lib/history.json";
  import {
    number,
    duration,
    dateLabel,
    type Track,
    type SearchResult,
  } from "$lib/types";
  import { searchParams } from "$lib/search";
  import { searchApple } from "$lib/apple-client";
  let history = snapshot;
  let historyStatus = "Saved snapshot";
  let busy = false;
  let error = "";
  let result: SearchResult | null = null;
  let selected: Track | null = null;
  let searchForm: SearchForm;
  let submitted = "";
  let query = "";
  let view = "list";
  let filter = "all";
  let loadingMore = false;
  let moreError = "";
  let controller: AbortController | undefined;
  let moreController: AbortController | undefined;
  function clearSearch() {
    controller?.abort();
    controller = undefined;
    moreController?.abort();
    moreController = undefined;
    searchForm.restore(new URLSearchParams());
    query = "";
    submitted = "";
    error = "";
    moreError = "";
    result = null;
    selected = null;
    busy = false;
    loadingMore = false;
    filter = "all";
    replaceState("/", {});
    window.scrollTo({
      top: 0,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }
  $: visible =
    result?.results.filter(
      (track) =>
        filter === "all" ||
        (filter === "matches"
          ? !!track.lyricSnippet
          : track.timing_type === filter),
    ) ?? [];
  $: latest = history[0];

  onMount(() => {
    const historyController = new AbortController();
    fetch("/api/history", { signal: historyController.signal })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        history = data;
        historyStatus = "Latest API snapshot";
      })
      .catch(() => {
        historyStatus = "Saved snapshot · live update unavailable";
      });
    if ($page.url.searchParams.size) {
      searchForm.restore($page.url.searchParams);
      search($page.url.searchParams, false);
    }
    return () => {
      controller?.abort();
      moreController?.abort();
      historyController.abort();
    };
  });
  async function search(input: URLSearchParams, scroll = true) {
    let params: URLSearchParams;
    try {
      params = searchParams(input);
    } catch (cause) {
      error = (cause as Error).message;
      return;
    }
    controller?.abort();
    moreController?.abort();
    moreController = undefined;
    loadingMore = false;
    const current = new AbortController();
    controller = current;
    busy = true;
    error = "";
    moreError = "";
    result = null;
    filter = "all";
    submitted =
      params.get("q") ??
      params.get("isrc") ??
      `${params.get("track")} · ${params.get("artist")}`;
    if (scroll) replaceState(`/?${params}`, {});
    if (scroll)
      setTimeout(
        () =>
          controller === current &&
          document.getElementById("results")?.scrollIntoView({
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
              .matches
              ? "instant"
              : "smooth",
            block: "start",
          }),
        20,
      );
    try {
      let data: SearchResult;
      if (params.has("q")) {
        data = await searchApple(params.get("q")!, 0, current.signal);
      } else {
        const response = await fetch(`/api/lookup?${params}`, {
          signal: current.signal,
        });
        const lookup = await response.json();
        if (!response.ok)
          throw new Error(
            lookup.message ?? "Search is unavailable. Please try again.",
          );
        data = lookup;
      }
      if (controller === current) result = data;
    } catch (cause) {
      if (controller === current && (cause as Error).name !== "AbortError")
        error = (cause as Error).message;
    } finally {
      if (controller === current) busy = false;
    }
  }
  async function loadMore() {
    if (!result?.nextOffset || loadingMore) return;
    const original = result;
    const current = new AbortController();
    moreController = current;
    loadingMore = true;
    moreError = "";
    try {
      const data = await searchApple(
        $page.url.searchParams.get("q") ?? "",
        original.nextOffset,
        current.signal,
      );
      if (result !== original) return;
      const ids = new Set(result.results.map((track) => track.id));
      result = {
        ...data,
        results: [
          ...result.results,
          ...data.results.filter((track: Track) => !ids.has(track.id)),
        ],
      };
    } catch (cause) {
      if (result === original && (cause as Error).name !== "AbortError")
        moreError = (cause as Error).message;
    } finally {
      if (moreController === current) loadingMore = false;
    }
  }
</script>

<svelte:head><title>BiniLyrics</title></svelte:head>
<main
  id="main"
  class="minimal-home"
  class:showing-results={!!result || busy || !!error}
>
  <h1 class="search-brand">
    <button
      class="brand-reset"
      onclick={clearSearch}
      aria-label="BiniLyrics — clear search">BiniLyrics</button
    >
  </h1>
  <section
    class="search-stage"
    aria-label="Search"
    class:has-results={!!result || busy}
  >
    <SearchForm
      bind:this={searchForm}
      bind:query
      {busy}
      compact
      onsearch={search}
      onselect={(track) => (selected = track)}
    />
  </section>
  {#if !result && !busy && !error}<SearchCarousel
      {history}
      {historyStatus}
    />{/if}
  {#if busy || error || result}<section
      class="results-section"
      id="results"
      aria-busy={busy}
    >
      <div class="section-heading">
        <div>
          <h2>{busy ? "Searching…" : `Results for “${submitted}”`}</h2>
        </div>
        {#if result}<span class="muted"
            >{number(result.results.length)}
            {result.provider === "apple" ? "songs" : "matches"}</span
          >
          <div class="view-controls" aria-label="Result layout">
            <button
              aria-label="List view"
              aria-pressed={view === "list"}
              class:active={view === "list"}
              onclick={() => (view = "list")}
              ><Icon name="list" size={18} /></button
            ><button
              aria-label="Cover view"
              aria-pressed={view === "covers"}
              class:active={view === "covers"}
              onclick={() => (view = "covers")}
              ><Icon name="grid" size={18} /></button
            >
          </div>{/if}
      </div>
      {#if error}<div class="empty-state" role="alert">
          <h3>Search unavailable</h3>
          <p>{error}</p>
          <button
            class="small-button"
            onclick={() => search($page.url.searchParams)}
            >Retry search <Icon name="arrow" size={16} /></button
          >
        </div>{:else if busy}<div class="loading-rows" aria-label="Searching">
          {#each [1, 2, 3] as row}<div><span></span><span></span></div>{/each}
        </div>{:else if result}{#if result.provider !== "apple"}<div
            class="result-toolbar"
          >
            <div class="filter-tabs">
              {#each [["all", "All lyrics"], ["word", "Word"], ["line", "Line"]] as [key, label]}<button
                  aria-pressed={filter === key}
                  class:active={filter === key}
                  onclick={() => (filter = key)}>{label}</button
                >{/each}
            </div>
          </div>{/if}
        {#if !visible.length}<div class="empty-state">
            <h3>
              {result.results.length
                ? "No matches with this filter."
                : "No results"}
            </h3>
            <p>
              {result.results.length
                ? "Choose All lyrics to see every result."
                : "Try another song, artist, or lyric."}
            </p>
          </div>{:else}<div
            class="track-list"
            class:cover-view={view === "covers"}
          >
            {#each visible as track, i}<button
                class="track-row"
                style={`--row:${Math.min(i, 5)}`}
                onclick={() => (selected = track)}
                ><span
                  class="track-monogram"
                  class:alternative={i % 3 === 1}
                  class:dark={i % 3 === 2}
                  ><Icon name="note" size={23} />{#if track.artwork}<img
                      src={view === "covers"
                        ? track.artworkLarge || track.artwork
                        : track.artwork}
                      alt=""
                      loading="lazy"
                      width="52"
                      height="52"
                    />{/if}</span
                ><span class="track-title"
                  ><strong>{track.track_name}</strong><span
                    >{track.artist_name}</span
                  >{#if track.lyricSnippet}<span class="lyric-match"
                      >Lyric match · “{track.lyricSnippet}”</span
                    >{/if}</span
                ><span class="track-album">{track.album_name}</span><span
                  class="timing"
                  class:discovery-action={track.provider === "apple"}
                  ><TimingIcon type={track.timing_type} />{track.provider ===
                  "apple"
                    ? "arrow"
                    : "bars"}
                  size={13}
                  />{track.provider === "apple"
                    ? ""
                    : track.timing_type === "word"
                      ? "Word"
                      : track.timing_type === "line"
                        ? "Line"
                        : "Plain"}</span
                ><span class="track-duration">{duration(track.duration)}</span
                ><Icon name="diagonal" size={18} /></button
              >{/each}
          </div>{/if}{#if result.nextOffset}<div class="load-more">
            <button
              class="small-button"
              disabled={loadingMore}
              onclick={loadMore}
              >{loadingMore ? "Loading…" : "More songs"}<Icon
                name="arrow"
                size={16}
              /></button
            >
          </div>{/if}{#if moreError}<p role="alert">{moreError}</p>{/if}{/if}
    </section>{/if}
</main>
{#if selected}{#key selected.id}<LyricReader
      track={selected}
      onclose={() => (selected = null)}
    />{/key}{/if}
