<script lang="ts">
  import { onMount } from "svelte";
  import type { Kawarp } from "@kawarp/core";
  let canvas: HTMLCanvasElement;
  let ready = false;

  onMount(() => {
    let renderer: Kawarp | undefined;
    let disposed = false;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => {
      if (!renderer) return;
      if (reduced.matches || document.hidden) {
        renderer.stop();
        renderer.renderFrame(12);
      } else renderer.start();
    };
    const resize = () => {
      renderer?.resize();
      if (reduced.matches) renderer?.renderFrame(12);
    };
    import("@kawarp/core")
      .then(({ Kawarp }) => {
        if (disposed) return;
        try {
          renderer = new Kawarp(canvas, {
            warpIntensity: 1.8,
            blurPasses: 12,
            dithering: 0.001,
            animationSpeed: 0.32,
            transitionDuration: 0,
            saturation: 1.05,
            tintIntensity: 0,
          });
          renderer.loadGradient(
            ["#b8cae9", "#6c8add", "#dce8ed", "#93b7d2", "#a7b9e8"],
            125,
          );
          renderer.renderFrame(12);
          ready = true;
          syncMotion();
        } catch {
          renderer?.dispose();
          renderer = undefined;
        }
      })
      .catch(() => {});
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", syncMotion);
    reduced.addEventListener("change", syncMotion);
    return () => {
      disposed = true;
      renderer?.dispose();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", syncMotion);
      reduced.removeEventListener("change", syncMotion);
    };
  });
</script>

<div class="liquid-background kawarp-background" aria-hidden="true">
  <canvas bind:this={canvas} class:ready></canvas>
</div>
