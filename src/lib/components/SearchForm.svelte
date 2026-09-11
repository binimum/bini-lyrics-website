<script lang="ts">
  import { afterUpdate, onMount, onDestroy } from "svelte";
  import Icon from "./Icon.svelte";
  import type { Suggestion } from "$lib/apple";
  import { suggestApple } from "$lib/apple-client";
  import type { Track } from "$lib/types";
  export let busy = false;
  export let compact = false;
  export let onsearch: (params: URLSearchParams) => void;
  export let onselect: (track: Track) => void;
  export let query = "";
  let panel: HTMLDivElement;
  let glassPath = "";
  let glassHeight = 110;
  let tabPosition: number | undefined;
  let tabWidth = 0;
  let targetPosition = 0;
  let targetWidth = 0;
  let tabFrame = 0;
  let surface = { w: 0, y: 0, r: 0, bottom: 0 };
  function drawSurface() {
    const { w, y, r, bottom } = surface;
    const left = tabPosition ?? 0,
      right = left + tabWidth;
    glassPath = `M ${r} ${y} H ${left - 12} Q ${left} ${y} ${left} ${y - 12} V 12 Q ${left} 0 ${left + 12} 0 H ${right - 12} Q ${right} 0 ${right} 12 V ${y - 12} Q ${right} ${y} ${right + 12} ${y} H ${w - r} Q ${w} ${y} ${w} ${y + r} V ${bottom - r} Q ${w} ${bottom} ${w - r} ${bottom} H ${r} Q 0 ${bottom} 0 ${bottom - r} V ${y + r} Q 0 ${y} ${r} ${y} Z`;
  }
  function measureSurface() {
    if (!panel) return;
    const row = panel.querySelector(".search-input-row") as HTMLElement;
    const tab = panel.querySelector(".integrated-tabs .active") as HTMLElement;
    const options = panel.querySelector(".autocomplete") as HTMLElement;
    if (!row || !tab) return;
    const bounds = panel.getBoundingClientRect();
    const rowBounds = row.getBoundingClientRect();
    const tabBounds = tab.getBoundingClientRect();
    const w = panel.clientWidth,
      y = rowBounds.top - bounds.top;
    const r = rowBounds.height / 2;
    const left = tabBounds.left - bounds.left,
      right = left + tabBounds.width;
    const bottom = y + rowBounds.height + (expanded ? options.offsetHeight : 0);
    glassHeight = bottom;
    if (
      surface.w !== w ||
      surface.y !== y ||
      surface.r !== r ||
      surface.bottom !== bottom
    )
      surface = { w, y, r, bottom };
    if (
      tabPosition === undefined ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      cancelAnimationFrame(tabFrame);
      tabPosition = targetPosition = left;
      tabWidth = targetWidth = right - left;
    } else if (targetPosition !== left || targetWidth !== right - left) {
      cancelAnimationFrame(tabFrame);
      targetPosition = left;
      targetWidth = right - left;
      const from = tabPosition,
        fromWidth = tabWidth,
        start = performance.now();
      const animate = (now: number) => {
        const progress = Math.min(1, (now - start) / 320);
        const eased = 1 - Math.pow(1 - progress, 3);
        tabPosition = from + (targetPosition - from) * eased;
        tabWidth = fromWidth + (targetWidth - fromWidth) * eased;
        drawSurface();
        if (progress < 1) tabFrame = requestAnimationFrame(animate);
      };
      tabFrame = requestAnimationFrame(animate);
    }
    drawSurface();
  }

  afterUpdate(measureSurface);
  onMount(() => {
    const observer = new ResizeObserver(measureSurface);
    observer.observe(panel);
    const options = panel.querySelector(".autocomplete");
    if (options) observer.observe(options);
    measureSurface();
    return () => {
      observer.disconnect();
      cancelAnimationFrame(tabFrame);
    };
  });
  let mode = "search";
  let artist = "";
  let album = "";
  let seconds: number | undefined;
  let isrc = "";
  let suggestions: Suggestion[] = [];
  let expanded = false;
  let active = -1;
  let suggestionError = "";
  let timer: ReturnType<typeof setTimeout>;
  let controller: AbortController | undefined;
  function closeSuggestions() {
    clearTimeout(timer);
    controller?.abort();
    expanded = false;
    active = -1;
  }
  onDestroy(closeSuggestions);
  function autocomplete() {
    closeSuggestions();
    suggestions = [];
    suggestionError = "";
    if (mode !== "search" || query.trim().length < 2) return;
    const term = query.trim();
    timer = setTimeout(async () => {
      const current = new AbortController();
      controller = current;
      try {
        const data = await suggestApple(term, current.signal);
        if (query.trim() !== term || current.signal.aborted) return;
        suggestions = data;
        expanded = !!suggestions.length;
      } catch {
        if (!current.signal.aborted)
          suggestionError = "Autocomplete unavailable — you can still search.";
      }
    }, 250);
  }
  function choose(suggestion: Suggestion) {
    closeSuggestions();
    if (suggestion.kind === "term") {
      query = suggestion.term;
      onsearch(new URLSearchParams({ q: query }));
    } else {
      onselect(suggestion.song);
    }
  }
  function keydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      closeSuggestions();
      return;
    }
    if (!expanded) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      active =
        (active + (event.key === "ArrowDown" ? 1 : -1) + suggestions.length) %
        suggestions.length;
    }
    if (event.key === "Enter" && active >= 0) {
      event.preventDefault();
      choose(suggestions[active]);
    }
  }
  function submit(event: SubmitEvent) {
    event.preventDefault();
    closeSuggestions();
    const params = new URLSearchParams();
    if (mode === "isrc") params.set("isrc", isrc);
    else if (mode === "track") {
      params.set("track", query);
      params.set("artist", artist);
      if (album) params.set("album", album);
      if (seconds !== undefined) params.set("duration", String(seconds));
    } else params.set("q", query);
    onsearch(params);
  }
  export function restore(params: URLSearchParams) {
    closeSuggestions();
    mode = params.has("isrc")
      ? "isrc"
      : params.has("track")
        ? "track"
        : "search";
    query = params.get("q") ?? params.get("track") ?? "";
    isrc = params.get("isrc") ?? "";
    artist = params.get("artist") ?? "";
    album = params.get("album") ?? "";
    seconds = params.has("duration")
      ? Number(params.get("duration"))
      : undefined;
  }
  export function preset(value: string) {
    mode = "search";
    query = value;
    closeSuggestions();
    onsearch(new URLSearchParams({ q: value }));
  }
</script>

<div
  bind:this={panel}
  class="search-panel"
  class:suggestions-open={expanded}
  class:compact
  onfocusout={(event) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node))
      closeSuggestions();
  }}
>
  {#if glassPath}<div
      class="search-glass-outline"
      style:height={`${glassHeight}px`}
      aria-hidden="true"
    >
      <div
        class="search-glass-fill"
        style:clip-path={`path('${glassPath}')`}
      ></div>
      <svg width="100%" height={glassHeight} overflow="visible"
        ><path d={glassPath} style={`d: path('${glassPath}')`} /></svg
      >
    </div>{/if}
  <div
    class="search-tabs integrated-tabs"
    role="tablist"
    aria-label="Search mode"
  >
    {#each compact ? [["search", "Search"], ["isrc", "ISRC"]] : [["search", "Search"], ["track", "Track + artist"], ["isrc", "ISRC"]] as [value, label]}
      <button
        type="button"
        role="tab"
        id={`tab-${value}`}
        aria-selected={mode === value}
        aria-controls="search-mode-panel"
        tabindex={mode === value ? 0 : -1}
        class:active={mode === value}
        onkeydown={(event) => {
          if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
            event.preventDefault();
            const tabs = Array.from(
              event.currentTarget.parentElement!.querySelectorAll("button"),
            );
            const index = tabs.indexOf(event.currentTarget);
            const next =
              event.key === "Home"
                ? 0
                : event.key === "End"
                  ? tabs.length - 1
                  : (index +
                      (event.key === "ArrowRight" ? 1 : -1) +
                      tabs.length) %
                    tabs.length;
            tabs[next].click();
            tabs[next].focus();
          }
        }}
        onclick={() => {
          mode = value;
          closeSuggestions();
        }}>{label}</button
      >
    {/each}
  </div>
  <div
    id="search-mode-panel"
    role="tabpanel"
    tabindex="-1"
    aria-labelledby={`tab-${mode}`}
  >
    <form onsubmit={submit}>
      <div class="search-input-row">
        <Icon name="search" size={24} />{#if mode === "isrc"}<input
            aria-label="ISRC"
            required
            maxlength="20"
            bind:value={isrc}
            placeholder="Enter an ISRC, e.g. GBAYE1101143"
          />{:else}<input
            aria-label={mode === "track"
              ? "Track title"
              : "Search songs, artists, or lyrics"}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={expanded}
            aria-controls="search-suggestions"
            aria-activedescendant={active >= 0
              ? `suggestion-${active}`
              : undefined}
            autocomplete="off"
            required
            maxlength="300"
            bind:value={query}
            oninput={autocomplete}
            onkeydown={keydown}
            placeholder={mode === "track"
              ? "Track title"
              : "A song, an artist, a line you remember…"}
          />{/if}<button
          class="search-submit"
          aria-label={busy ? "Searching" : "Search"}
          type="submit"
          disabled={busy}
          ><span class="arrow-track" aria-hidden="true"
            ><span class="arrow-current"><Icon name="arrow" /></span><span
              class="arrow-next"><Icon name="arrow" /></span
            ></span
          ></button
        >
      </div>
      <div
        id="search-suggestions"
        role="listbox"
        aria-label="Search suggestions"
        class="autocomplete"
        class:is-open={expanded}
      >
        {#if expanded}{#each suggestions as suggestion, i}<button
              id={`suggestion-${i}`}
              type="button"
              role="option"
              aria-selected={active === i}
              class:highlighted={active === i}
              onpointerdown={(event) => event.preventDefault()}
              onclick={() => choose(suggestion)}
              >{#if suggestion.kind === "term"}<Icon
                  name="search"
                  size={18}
                /><span>{suggestion.term}</span><Icon
                  name="diagonal"
                  size={16}
                />{:else}{#if suggestion.song.artwork}<img
                    src={suggestion.song.artwork}
                    alt=""
                    width="44"
                    height="44"
                  />{:else}<Icon name="note" />{/if}<span
                  ><strong>{suggestion.song.track_name}</strong><small
                    >{suggestion.song.artist_name}</small
                  >{#if suggestion.song.lyricSnippet}<small class="lyric-match"
                      >Lyric match · “{suggestion.song.lyricSnippet}”</small
                    >{/if}</span
                ><Icon name="arrow" size={16} />{/if}</button
            >{/each}{/if}
      </div>
      {#if mode === "track"}<div class="precise-fields">
          <label
            >Artist<input
              required
              bind:value={artist}
              placeholder="Coldplay"
              maxlength="300"
            /></label
          ><label
            >Album <span>optional</span><input
              bind:value={album}
              placeholder="Mylo Xyloto"
              maxlength="300"
            /></label
          ><label
            >Duration <span>seconds, optional</span><input
              type="number"
              min="1"
              step="any"
              bind:value={seconds}
              placeholder="279"
            /></label
          >
        </div>{/if}
    </form>
  </div>
  {#if !compact || suggestionError}<div class="search-hint">
      <span
        >{suggestionError ||
          (mode === "search"
            ? "Discover with Apple Music. Read with BiniLyrics."
            : "Look up the BiniLyrics collection directly.")}</span
      ><span>Word by word. Line by line.</span>
    </div>
  {/if}
</div>
