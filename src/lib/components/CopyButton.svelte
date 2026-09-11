<script lang="ts">
  import Icon from "./Icon.svelte";
  export let copied = false;
  export let label = "Copy URL";
  export let onclick: () => void;
</script>

<button
  type="button"
  class:copied
  aria-label={copied ? "Copied" : label}
  title={copied ? "Copied" : label}
  {onclick}
>
  <span class="copy-icon"><Icon name="copy" size={18} /></span>
  <span class="check-icon"><Icon name="check" size={18} /></span>
</button>

<style>
  button {
    position: relative;
    display: grid;
    place-items: center;
    flex: 0 0 40px;
    width: 40px;
    height: 40px;
    padding: 0;
    border-radius: 50%;
    color: var(--glass-text);
    background: var(--glass-surface);
    box-shadow:
      inset 0 1px 0 var(--glass-edge),
      0 2px 0 #192c4920;
  }
  button:hover {
    background: #6c8add30;
  }
  button:active {
    scale: 0.96;
  }
  span {
    position: absolute;
    display: grid;
    place-items: center;
    transition:
      scale 180ms cubic-bezier(0.2, 0, 0, 1),
      opacity 180ms,
      filter 180ms;
  }
  .check-icon,
  .copied .copy-icon {
    scale: 0.25;
    opacity: 0;
    filter: blur(4px);
  }
  .copied .check-icon {
    scale: 1;
    opacity: 1;
    filter: blur(0);
  }
  @media (prefers-reduced-motion: reduce) {
    span {
      transition: none;
    }
  }
</style>
