<script lang="ts">
  import { onMount } from "svelte";
  import HistoryChart from "./HistoryChart.svelte";
  import Icon from "./Icon.svelte";
  import TtmlPreview from "./TtmlPreview.svelte";
  import { number, dateLabel, type HistoryPoint } from "$lib/types";
  export let history: HistoryPoint[];
  export let historyStatus = "";
  let rail: HTMLDivElement;
  let active = 0;
  let pageCount = 3;
  let step = 1;
  let dragging = false;
  let progress = 0;
  let reducedMotion = false;
  let lastScroll = 0;
  const autoScrollDuration = 6500;
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
    const listeners = new AbortController();
    const options = { signal: listeners.signal };
    let pointer: number | undefined;
    let startX = 0;
    let startScroll = 0;
    let moved = false;
    const interact = () => {
      progress = 0;
    };
    rail.addEventListener(
      "pointerdown",
      (event) => {
        interact();
        moved = false;
        if (event.pointerType !== "mouse" || event.button !== 0) return;
        pointer = event.pointerId;
        startX = event.clientX;
        startScroll = rail.scrollLeft;
      },
      options,
    );
    rail.addEventListener(
      "pointermove",
      (event) => {
        if (pointer !== event.pointerId) return;
        const delta = event.clientX - startX;
        if (!moved && Math.abs(delta) < 6) return;
        moved = true;
        dragging = true;
        rail.classList.add("is-dragging");
        if (!rail.hasPointerCapture(event.pointerId))
          rail.setPointerCapture(event.pointerId);
        event.preventDefault();
        rail.scrollLeft = startScroll - delta;
      },
      options,
    );
    const release = (event: PointerEvent) => {
      if (pointer !== event.pointerId) return;
      pointer = undefined;
      dragging = false;
      rail.classList.remove("is-dragging");
      if (rail.hasPointerCapture(event.pointerId))
        rail.releasePointerCapture(event.pointerId);
      interact();
      if (moved)
        go(
          Math.max(
            0,
            Math.min(pageCount - 1, Math.round(rail.scrollLeft / step)),
          ),
        );
    };
    window.addEventListener("pointerup", release, options);
    window.addEventListener("pointercancel", release, options);
    rail.addEventListener(
      "click",
      (event) => {
        if (!moved) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        moved = false;
      },
      { ...options, capture: true },
    );
    rail.addEventListener(
      "dragstart",
      (event) => event.preventDefault(),
      options,
    );
    for (const name of ["wheel", "keydown"]) {
      rail.addEventListener(name, interact, options);
    }
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => {
      reducedMotion = motion.matches;
      progress = 0;
    };
    updateMotion();
    motion.addEventListener("change", updateMotion, options);
    let previousFrame = performance.now();
    let animationFrame: number;
    const advance = (now: number) => {
      const delta = Math.min(now - previousFrame, 100);
      previousFrame = now;
      if (
        pageCount > 1 &&
        !dragging &&
        pointer === undefined &&
        !document.hidden &&
        !reducedMotion &&
        !rail.parentElement?.matches(":hover, :focus-within") &&
        now - lastScroll > 180
      ) {
        progress = Math.min(1, progress + delta / autoScrollDuration);
        if (progress >= 1) go((active + 1) % pageCount);
      }
      animationFrame = requestAnimationFrame(advance);
    };
    animationFrame = requestAnimationFrame(advance);
    return () => {
      observer.disconnect();
      listeners.abort();
      cancelAnimationFrame(animationFrame);
    };
  });
  const labels = [
    "Collection",
    "Use in your webapp",
    "Use elsewhere with the API",
    "Community",
    "Projects that use BiniLyrics",
  ];
  const projects = [
    {
      name: "Better Lyrics",
      url: "https://github.com/better-lyrics/better-lyrics",
    },
    { name: "YouLyPlus", url: "https://github.com/ibratabian17/YouLyPlus" },
    {
      name: "Monochrome",
      url: "https://github.com/monochrome-music/monochrome",
    },
  ];
  $: latest = history[0];
  function go(index: number) {
    progress = 0;
    lastScroll = performance.now();
    const target = rail.children[index] as HTMLElement;
    rail.scrollTo({
      left: target.offsetLeft,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }
  function update() {
    const next = Math.min(pageCount - 1, Math.round(rail.scrollLeft / step));
    if (next !== active) progress = 0;
    active = next;
    lastScroll = performance.now();
  }
</script>

<section
  class="search-carousel"
  aria-label="BiniLyrics"
  aria-roledescription="carousel"
>
  <div
    class="carousel-rail"
    class:is-dragging={dragging}
    bind:this={rail}
    onscroll={update}
  >
    {#each labels as label, i}<article
        class="carousel-card"
        class:carousel-demo={i === 1}
        class:carousel-ttml={i === 2}
        class:carousel-project-card={i === 4}
        aria-roledescription="slide"
        aria-label={`${i + 1} of ${labels.length}: ${label}`}
      >
        {#if i === 1}
          <video
            class="carousel-demo-video"
            src="/am-lyrics-demo.webm"
            autoplay
            muted
            loop
            playsinline
            onloadedmetadata={(event) => {
              event.currentTarget.playbackRate = 0.9;
            }}
            aria-hidden="true"
          ></video>
        {/if}
        {#if i === 2}<TtmlPreview />{/if}
        {#if i === 1 || i === 2}
          <div
            class="carousel-demo-blur carousel-demo-blur-top"
            aria-hidden="true"
          ></div>
          <div
            class="carousel-demo-blur carousel-demo-blur-bottom"
            aria-hidden="true"
          ></div>
        {/if}
        <div class="carousel-card-top">
          <h2>{label}</h2>
          {#if i < 3}<a
              class="carousel-action"
              href={i === 0
                ? "/collection"
                : i === 1
                  ? "https://github.com/binimum/am-lyrics#readme"
                  : "/developers"}
              target={i === 1 ? "_blank" : undefined}
              rel={i === 1 ? "noopener noreferrer" : undefined}
              aria-label={i === 0
                ? "View history"
                : i === 1
                  ? "Open am-lyrics README in a new tab"
                  : "Open API reference"}><Icon name="diagonal" /></a
            >
          {/if}
        </div>
        {#if i === 0}
          <div class="carousel-history">
            <div>
              <strong>{number(latest.count)}</strong><span
                >Lyric files · {dateLabel(latest.date)}</span
              >
            </div>
            <HistoryChart {history} compact fill />
          </div>
          {#if historyStatus.includes("unavailable")}<small
              >Saved snapshot · live update unavailable</small
            >{/if}
        {:else if i === 1}<p class="carousel-demo-description">
            Follow every word, right on time. Bring synced lyrics to your
            webapp effortlessly with am-lyrics.
          </p>
        {:else if i === 2}<p class="carousel-demo-description">
            Use the API to query for TTML directly. Find lyrics by ISRC or by
            track and artist. No API key required.
          </p>
        {:else if i === 3}<div class="carousel-demo-description">
            BiniLyrics is completely built on the contributions of the
            community. If you have lyrics to share, please consider contributing
            to the project!
          </div>
        {:else}<div class="carousel-projects">
            {#each projects as project}
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${project.name} on GitHub (opens in a new tab)`}
              >
                <span>{project.name}</span><Icon name="diagonal" size={17} />
              </a>
            {/each}
          </div>{/if}
      </article>{/each}
  </div>
  <div class="carousel-indicators" aria-label="Choose carousel slide">
    {#each labels.slice(0, pageCount) as label, i}<button
        class:active={active === i}
        aria-label={`Show carousel page ${i + 1}`}
        aria-current={active === i ? "true" : undefined}
        onclick={() => go(i)}
        ><span class="indicator-track" aria-hidden="true"
          ><i
            style={`transform: translateX(${((active === i ? (reducedMotion ? 1 : progress) : 0) - 1) * 101}%); opacity: ${active === i ? (reducedMotion ? 0.9 : Math.min(0.9, progress * 6)) : 0}; visibility: ${active === i && (reducedMotion || progress > 0.005) ? "visible" : "hidden"}`}
          ></i></span
        ></button
      >{/each}
  </div>
</section>

<style>
  .carousel-rail {
    cursor: grab;
  }
  .carousel-rail.is-dragging {
    cursor: grabbing;
    scroll-snap-type: none;
    scroll-behavior: auto;
    user-select: none;
  }
  .carousel-card {
    position: relative;
  }
  .carousel-project-card {
    display: flex;
    flex-direction: column;
  }
  .carousel-projects {
    display: grid;
    gap: 4px;
    margin-top: auto;
    padding-top: 14px;
    color: var(--glass-text);
  }
  .carousel-projects a {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-height: 44px;
    padding: 10px 12px;
    border-radius: 12px;
    background: var(--glass-surface);
    box-shadow: inset 0 1px 0 var(--glass-edge);
    font-size: 13px;
    transition:
      background-color 180ms,
      scale 180ms;
  }
  .carousel-projects a:hover {
    background: #6c8add30;
  }
  .carousel-projects a:active {
    scale: 0.96;
  }
</style>
