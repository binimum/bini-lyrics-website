<script lang="ts">
  import type { HistoryPoint } from "$lib/types";
  import { number, dateLabel } from "$lib/types";
  export let history: HistoryPoint[];
  export let compact = false;
  let hover = -1;
  $: sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
  $: min = Math.min(...sorted.map((p) => p.count));
  $: max = Math.max(...sorted.map((p) => p.count));
  $: first = new Date(sorted[0]?.date ?? 0).getTime();
  $: last = new Date(sorted.at(-1)?.date ?? 0).getTime();
  $: points = sorted.map((p) => ({
    x: 10 + ((new Date(p.date).getTime() - first) / (last - first || 1)) * 580,
    y: 145 - ((p.count - min) / (max - min || 1)) * 125,
  }));
  $: line = points.map((p, i) => `${i ? "L" : "M"}${p.x},${p.y}`).join(" ");
</script>

<div class:compact class="chart">
  <svg
    viewBox="0 0 600 170"
    role="img"
    aria-label={`Catalogue grew from ${number(min)} to ${number(max)} lyrics between ${sorted[0]?.date} and ${sorted.at(-1)?.date}`}
  >
    {#if !compact}<defs
        ><linearGradient
          id={compact ? "chart-fill-small" : "chart-fill"}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
          ><stop offset="0%" stop-color="#b7d855" stop-opacity=".3" /><stop
            offset="100%"
            stop-color="#b7d855"
            stop-opacity="0"
          /></linearGradient
        ></defs
      >
      {#each [35, 90, 145] as y}<path
          d={`M0 ${y}H600`}
          stroke="currentColor"
          stroke-opacity=".08"
          stroke-dasharray="3 5"
        />{/each}
      <path
        d={`${line} L590,165 L10,165 Z`}
        fill={`url(#${compact ? "chart-fill-small" : "chart-fill"})`}
      />{/if}<path
      d={line}
      fill="none"
      stroke={compact ? "currentColor" : "#52622c"}
      stroke-width={compact ? "1.5" : "2.5"}
      vector-effect="non-scaling-stroke"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    {#if !compact && points.length}<circle
        cx={points.at(-1)?.x}
        cy={points.at(-1)?.y}
        r="4"
        fill="#52622c"
      />{/if}
  </svg>
  {#if !compact}<div class="chart-dates">
      <span>{sorted[0] ? dateLabel(sorted[0].date) : ""}</span><span
        >{sorted.at(-1) ? dateLabel(sorted.at(-1)!.date) : ""}</span
      >
    </div>
    <label class="history-inspector"
      >Explore the history <input
        type="range"
        min="0"
        max={Math.max(0, sorted.length - 1)}
        bind:value={hover}
        aria-label="Explore catalogue history"
      /><span
        >{sorted[hover]
          ? `${dateLabel(sorted[hover].date)} · ${number(sorted[hover].count)} lyrics`
          : "Move the slider to inspect a day"}</span
      ></label
    >{/if}
</div>
