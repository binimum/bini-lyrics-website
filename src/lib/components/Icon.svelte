<script lang="ts">
  export let name = "arrow";
  export let size = 20;
  const paths: Record<string, string> = {
    grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
    list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
    arrow: "M5 12h14m-6-6 6 6-6 6",
    diagonal: "M6 18 18 6M6 6h12v12",
    search: "M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
    close: "m6 6 12 12M6 18 18 6",
    copy: "M9 9h11v12H9zM15 9V3H3v12h6",
    check: "m5 12 4 4L19 6",
    download: "M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5",
    code: "m8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18",
    chevron: "m9 5 7 7-7 7",
    bars: "M4 10v4m4-8v12m4-16v20m4-16v12m4-8v4",
    note: "M9 18V5l11-2v13M9 5v5l11-2M9 18c0 4-7 4-7 0s7-4 7 0m11-2c0 4-7 4-7 0s7-4 7 0",
    globe:
      "M2 12h20M12 2c7 7 7 13 0 20-7-7-7-13 0-20m10 10a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
  };
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.7"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"><path d={paths[name] ?? paths.arrow} /></svg
>
