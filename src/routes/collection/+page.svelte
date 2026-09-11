<script lang="ts">
  import { onMount } from "svelte";
  import snapshot from "$lib/history.json";
  import { number, dateLabel } from "$lib/types";
  import HistoryChart from "$lib/components/HistoryChart.svelte";
  let history = snapshot;
  let range = 0;
  $: latest = history[0];
  $: earliest = history.at(-1)!;
  $: filtered = range
    ? history.filter(
        (p) =>
          new Date(p.date).getTime() >=
          new Date(latest.date).getTime() - (range - 1) * 86400000,
      )
    : history;
  onMount(() => {
    const controller = new AbortController();
    fetch("/api/history", { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        history = data;
      })
      .catch(() => {});
    return () => controller.abort();
  });
</script>

<svelte:head
  ><title>BiniLyrics: history</title><meta
    name="description"
    content="Explore the BiniLyrics catalogue and its growth over time, with dated lyric counts and collection history."
  /></svelte:head
>
<main id="main" class="inner-page">
  <h1>Collection</h1>
  <div class="stats-row">
    <div class="stat">
      <span>Lyric files</span><strong>{number(latest.count)}</strong>
    </div>
    <div class="stat">
      <span>Since last update</span><strong
        >+{number(latest.count - (history[1]?.count ?? latest.count))}</strong
      >
    </div>
    <div class="stat">
      <span>Total added</span><strong
        >+{number(latest.count - earliest.count)}</strong
      >
    </div>
  </div>
  <div class="chart-panel">
    <div class="chart-controls">
      <h2>Lyric files</h2>
      <div class="filter-tabs">
        {#each [[30, "30 days"], [90, "90 days"], [0, "All time"]] as [value, label]}<button
            class:active={range === value}
            aria-pressed={range === value}
            onclick={() => (range = Number(value))}>{label}</button
          >{/each}
      </div>
    </div>
    <HistoryChart history={filtered} />
  </div>
</main>
