<script lang="ts">
  import { onMount } from "svelte";
  import HistoryChart from "./HistoryChart.svelte";
  import Icon from "./Icon.svelte";
  import { number, dateLabel, type HistoryPoint } from "$lib/types";
  export let history: HistoryPoint[];
  export let historyStatus = "";
  let rail: HTMLDivElement;
  let active = 0;
  let pageCount = 3;
  let step = 1;
  function measure() {
    if (!rail?.children.length) return;
    const first = rail.children[0] as HTMLElement;
    step = first.offsetWidth + 16;
    pageCount = Math.max(
      1,
      labels.length - Math.floor((rail.clientWidth + 16) / step) + 1,
    );
    update();
  }
  onMount(() => {
    const observer = new ResizeObserver(measure);
    observer.observe(rail);
    measure();
    return () => observer.disconnect();
  });
  const labels = [
    "History",
    "For developers",
    "Placeholder 1",
    "Placeholder 2",
  ];
  $: latest = history[0];
  function go(index: number) {
    const target = rail.children[index] as HTMLElement;
    rail.scrollTo({
      left: target.offsetLeft,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }
  function update() {
    active = Math.min(pageCount - 1, Math.round(rail.scrollLeft / step));
  }
</script>

<section
  class="search-carousel"
  aria-label="BiniLyrics"
  aria-roledescription="carousel"
>
  <div class="carousel-rail" bind:this={rail} onscroll={update}>
    {#each labels as label, i}<article
        class="carousel-card"
        aria-roledescription="slide"
        aria-label={`${i + 1} of ${labels.length}: ${label}`}
      >
        <div class="carousel-card-top">
          <h2>{i > 1 ? "Placeholder" : label}</h2>
          {#if i < 2}<a
              class="carousel-action"
              href={i === 0 ? "/collection" : "/developers"}
              aria-label={i === 0 ? "View history" : "Open API reference"}
              ><Icon name="diagonal" /></a
            >
          {:else}<button
              class="carousel-action"
              disabled
              aria-label="Placeholder action"><Icon name="diagonal" /></button
            >{/if}
        </div>
        {#if i === 0}
          <div class="carousel-history">
            <div>
              <strong>{number(latest.count)}</strong><span
                >Lyric files · {dateLabel(latest.date)}</span
              >
            </div>
            <HistoryChart {history} compact />
          </div>
          {#if historyStatus.includes("unavailable")}<small
              >Saved snapshot · live update unavailable</small
            >{/if}
        {:else if i === 1}<div class="carousel-api">
            <Icon name="code" size={32} /><span>Lyrics API</span><code
              >GET /?isrc=…</code
            >
          </div>
        {:else}<div class="carousel-placeholder" aria-hidden="true">
            <span></span><span></span><span></span>
          </div>{/if}
      </article>{/each}
  </div>
  <div class="carousel-indicators" aria-label="Choose carousel slide">
    {#each labels.slice(0, pageCount) as label, i}<button
        class:active={active === i}
        aria-label={`Show carousel page ${i + 1}`}
        aria-current={active === i ? "true" : undefined}
        onclick={() => go(i)}><span></span></button
      >{/each}
  </div>
</section>
