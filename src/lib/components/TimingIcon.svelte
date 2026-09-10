<script lang="ts">
  export let type = "plain";
  export let size = 22;
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 28 22"
  fill="currentColor"
  aria-hidden="true"
>
  {#each [[2, 5, 7], [11, 5, 6], [19, 5, 7], [2, 13, 5], [9, 13, 9], [20, 13, 6]] as [x, y, width], i}
    <rect
      {x}
      {y}
      {width}
      height="3"
      rx="1"
      opacity={type === "word"
        ? i === 1
          ? 1
          : 0.25
        : type === "line"
          ? i < 3
            ? 1
            : 0.25
          : 1}
    />
  {/each}
</svg>
