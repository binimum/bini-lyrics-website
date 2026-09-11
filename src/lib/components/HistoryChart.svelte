<script lang="ts">
  import type { HistoryPoint } from "$lib/types";
  import { number, dateLabel } from "$lib/types";
  export let history: HistoryPoint[];
  export let compact = false;
  export let fill = false;
  let hover = -1;
  let plot: HTMLDivElement;
  $: if (history) hover = -1;
  $: sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
  $: min = Math.min(...sorted.map((p) => p.count));
  $: max = Math.max(...sorted.map((p) => p.count));
  $: first = new Date(sorted[0]?.date ?? 0).getTime();
  $: last = new Date(sorted.at(-1)?.date ?? 0).getTime();
  $: points = sorted.map((p) => ({
    x: (fill ? 0 : 10) +
      ((new Date(p.date).getTime() - first) / (last - first || 1)) *
        (fill ? 600 : 580),
    y: 145 - ((p.count - min) / (max - min || 1)) * 125,
  }));
  $: line = points.map((p, i) => `${i ? "L" : "M"}${p.x},${p.y}`).join(" ");
  $: selected = sorted[hover];
  $: point = points[hover];
  function inspect(event: PointerEvent) {
    if (compact || !points.length) return;
    const bounds = plot.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 600;
    hover = points.reduce(
      (nearest, p, i) =>
        Math.abs(p.x - x) < Math.abs(points[nearest].x - x) ? i : nearest,
      0,
    );
  }
  function navigate(event: KeyboardEvent) {
    if (compact || !points.length) return;
    const current = hover < 0 ? points.length - 1 : hover;
    if (event.key === "ArrowRight" || event.key === "ArrowUp")
      hover = Math.min(points.length - 1, current + 1);
    else if (event.key === "ArrowLeft" || event.key === "ArrowDown")
      hover = Math.max(0, current - 1);
    else if (event.key === "Home") hover = 0;
    else if (event.key === "End") hover = points.length - 1;
    else if (event.key === "Escape") hover = -1;
    else return;
    event.preventDefault();
  }
</script>

<div class:compact class="chart">
  <!-- svelte-ignore a11y_no_noninteractive_tabindex (Only the interactive slider variant receives tabindex; the compact chart remains unfocusable.) -->
  <div
    class="chart-plot"
    bind:this={plot}
    role={compact ? undefined : "slider"}
    tabindex={compact ? undefined : 0}
    aria-label={compact ? undefined : "Explore catalogue history"}
    aria-valuemin={compact ? undefined : 0}
    aria-valuemax={compact ? undefined : Math.max(0, sorted.length - 1)}
    aria-valuenow={compact ? undefined : Math.max(0, hover)}
    aria-valuetext={compact
      ? undefined
      : selected
        ? `${dateLabel(selected.date)}: ${number(selected.count)} lyrics`
        : "Use arrow keys to explore history"}
    onpointermove={inspect}
    onpointerdown={inspect}
    onpointerleave={() => (hover = -1)}
    onfocus={() => {
      if (!compact && hover < 0) hover = sorted.length - 1;
    }}
    onblur={() => (hover = -1)}
    onkeydown={navigate}
  >
    <svg
      viewBox="0 0 600 170"
      role="img"
      aria-label={`Catalogue grew from ${number(min)} to ${number(max)} lyrics between ${sorted[0]?.date} and ${sorted.at(-1)?.date}`}
    >
      {#if !compact || fill}<defs
          ><linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1"
            ><stop offset="0%" stop-color="#b7d855" stop-opacity=".3" /><stop
              offset="100%"
              stop-color="#b7d855"
              stop-opacity="0"
            /></linearGradient
          ></defs
        >
        {/if}{#if !compact}{#each [35, 90, 145] as y}<path
            d={`M0 ${y}H600`}
            stroke="currentColor"
            stroke-opacity=".08"
            stroke-dasharray="3 5"
          />{/each}
        {/if}{#if !compact || fill}<path
          d={`${line} L${fill ? 600 : 590},${fill ? 170 : 165} L${fill ? 0 : 10},${fill ? 170 : 165} Z`}
          fill="url(#chart-fill)"
        />{/if}<path
        d={line}
        fill="none"
        stroke={compact ? "currentColor" : "#52622c"}
        stroke-width={compact ? "1.5" : "2.5"}
        vector-effect="non-scaling-stroke"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      {#if !compact && point}
        <path
          d={`M${point.x} 10V165`}
          stroke="currentColor"
          stroke-opacity=".25"
          stroke-dasharray="3 4"
        />
        <circle
          cx={point.x}
          cy={point.y}
          r="5"
          fill="#52622c"
          stroke="var(--glass-edge)"
          stroke-width="2"
        />
      {:else if !compact && points.length}<circle
          cx={points.at(-1)?.x}
          cy={points.at(-1)?.y}
          r="4"
          fill="#52622c"
        />{/if}
    </svg>
    {#if !compact && selected && point}
      <div
        class="chart-tooltip"
        class:below={point.y < 50}
        style={`--point-x:${point.x / 6}%; --point-y:${point.y / 1.7}%`}
      >
        <strong>{number(selected.count)} lyrics</strong>
        <span>{dateLabel(selected.date)}</span>
      </div>
    {/if}
  </div>
  {#if !compact}<div class="chart-dates">
      <span>{sorted[0] ? dateLabel(sorted[0].date) : ""}</span><span
        >{sorted.at(-1) ? dateLabel(sorted.at(-1)!.date) : ""}</span
      >
    </div>
  {/if}
</div>

<style>
  .chart-plot {
    position: relative;
  }
  .chart:not(.compact) .chart-plot svg {
    max-height: none;
  }
  .chart-plot[role="slider"] {
    cursor: crosshair;
    border-radius: 8px;
  }
  .chart-tooltip {
    position: absolute;
    left: clamp(82px, var(--point-x), calc(100% - 82px));
    top: var(--point-y);
    transform: translate(-50%, calc(-100% - 12px));
    display: grid;
    gap: 4px;
    width: 164px;
    padding: 10px 12px;
    border: 1px solid var(--glass-edge);
    border-radius: 12px;
    background: var(--glass-surface);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    box-shadow: 0 4px 16px #14244718;
    color: var(--glass-text);
    font-size: 12px;
    pointer-events: none;
  }
  .chart-tooltip.below {
    transform: translate(-50%, 12px);
  }
  .chart-tooltip span {
    color: var(--glass-muted);
    font-size: 11px;
  }
</style>
