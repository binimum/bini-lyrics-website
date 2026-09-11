<script lang="ts">
  import "../app.css";
  import { onMount, tick } from "svelte";
  import { page } from "$app/stores";
  import LiquidBackground from "$lib/components/LiquidBackground.svelte";
  let dark = false;
  let requestedDark = false;
  let themeTransition:
    { skipTransition: () => void; finished: Promise<void> } | undefined;
  let transitionTimer: ReturnType<typeof setTimeout>;
  function setTheme(next: boolean, animate = true) {
    requestedDark = next;
    if (
      next === dark &&
      document.documentElement.dataset.theme === (next ? "dark" : "light")
    )
      return;
    const apply = async () => {
      dark = next;
      document.documentElement.dataset.theme = dark ? "dark" : "light";
      await tick();
    };
    themeTransition?.skipTransition();
    if (!animate || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      void apply();
      return;
    }
    if (document.startViewTransition) {
      themeTransition = document.startViewTransition(apply);
      void themeTransition.finished.catch(() => {});
    } else {
      clearTimeout(transitionTimer);
      document.documentElement.classList.add("theme-transitioning");
      void apply();
      transitionTimer = setTimeout(
        () => document.documentElement.classList.remove("theme-transitioning"),
        450,
      );
    }
  }
  onMount(() => {
    const preference = matchMedia("(prefers-color-scheme: dark)");
    const update = (animate = true) => {
      let saved: string | null = null;
      try {
        saved = localStorage.getItem("binilyrics-theme");
      } catch {}
      setTheme(saved ? saved === "dark" : preference.matches, animate);
    };
    update(false);
    const followSystem = () => update();
    preference.addEventListener("change", followSystem);
    return () => {
      preference.removeEventListener("change", followSystem);
      clearTimeout(transitionTimer);
      themeTransition?.skipTransition();
      document.documentElement.classList.remove("theme-transitioning");
    };
  });
  function toggleTheme() {
    const next = !requestedDark;
    setTheme(next);
    try {
      localStorage.setItem("binilyrics-theme", next ? "dark" : "light");
    } catch {}
  }
</script>

<svelte:head
  ><meta
    name="description"
    content="Search songs, artists, and lyrics. Find synced lyrics with BiniLyrics."
  />
  <link rel="canonical" href="https://lyrics.binimum.org">
  <meta name="robots" content="index, follow" />
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <meta name="color-scheme" content="light dark" />

  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://lyrics.binimum.org" />
  <meta property="og:title" content="BiniLyrics" />
  <meta property="og:description" content="Search songs, artists, and lyrics. Find synced lyrics with BiniLyrics." />
  <meta property="og:image" content="https://lyrics.binimum.org/og.jpg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:site_name" content="BiniLyrics" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="https://lyrics.binimum.org" />
  <meta name="twitter:title" content="BiniLyrics" />
  <meta name="twitter:description" content="Search songs, artists, and lyrics. Find synced lyrics with BiniLyrics." />
  <meta name="twitter:image" content="https://lyrics.binimum.org/og.jpg" />
  <meta name="twitter:creator" content="@binnymum" />
  </svelte:head
>
<LiquidBackground />
<a class="skip" href="#main">Skip to content</a>
<div class="site-shell minimal-shell">
  <header class="minimal-header">
    {#if $page.url.pathname !== "/"}<a
        href="/"
        data-sveltekit-reload
        class="back-search">← Search</a
      >{/if}
    <button
      class="theme-toggle"
      onclick={toggleTheme}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        aria-hidden="true"
        >{#if dark}<circle cx="12" cy="12" r="4" /><path
            d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"
          />{:else}<path
            d="M20 15.5A9 9 0 0 1 8.5 4 9 9 0 1 0 20 15.5Z"
          />{/if}</svg
      >
    </button>
  </header>
  <slot />
</div>
