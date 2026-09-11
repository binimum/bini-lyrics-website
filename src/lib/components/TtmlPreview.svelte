<script lang="ts">
  // Opening lyric passage from the supplied TTML, formatted for the card.
  const source = `<body dur="2:53.985">
  <div begin="3.465" end="7.833">
    <p ttm:agent="v2" itunes:key="L1">
      <span begin="3.465" end="4.680">Baby,</span>
      <span begin="5.398" end="5.767">I</span>
      <span begin="5.767" end="6.133">like</span>
      <span begin="6.133" end="6.551">your</span>
      <span begin="6.551" end="7.833">style</span>
    </p>
  </div>
</body>`;
  const tokens = source.split(/(<[^>]+>)/g).flatMap((part) =>
    part.startsWith("<")
      ? part.split(/("[^"]*"|[\w:.-]+(?=\s*=))/g).map((text) => ({
          text,
          kind: text.startsWith('"')
            ? "value"
            : /^[\w:.-]+$/.test(text)
              ? "attribute"
              : "tag",
        }))
      : [{ text: part, kind: "plain" }],
  );
</script>

{#each ["sharp", "blurred"] as layer}
  <div class={`preview-layer ${layer}`} aria-hidden="true">
    <pre><code
        >{#each tokens as token}<span class={token.kind}>{token.text}</span
          >{/each}</code
      ></pre>
  </div>
{/each}

<style>
  .preview-layer {
    position: absolute;
    inset: 0;
    pointer-events: none;
    user-select: none;
    mask-image: var(--preview-mask);
    -webkit-mask-image: var(--preview-mask);
  }
  .sharp {
    --preview-mask: linear-gradient(
      transparent 60px,
      #000 96px,
      #000 142px,
      transparent 180px
    );
  }
  .blurred {
    --preview-mask: linear-gradient(
      #000 60px,
      transparent 96px,
      transparent 142px,
      #000 180px
    );
    opacity: 0.5;
  }
  .blurred pre {
    filter: blur(5px);
  }
  pre {
    position: absolute;
    inset: 38px 0 auto 20px;
    margin: 0;
    overflow: hidden;
    font: 10px/21px var(--mono);
    letter-spacing: -0.25px;
    white-space: pre;
    color: var(--glass-text);
    pointer-events: none;
    user-select: none;
    mask-image: linear-gradient(to right, #000 80%, transparent);
    -webkit-mask-image: linear-gradient(to right, #000 80%, transparent);
  }
  .tag {
    color: #6544a2;
  }
  .attribute {
    color: #254b94;
  }
  .value {
    color: #226150;
  }
  :global([data-theme="dark"]) .tag {
    color: #d6b2ff;
  }
  :global([data-theme="dark"]) .attribute {
    color: #9ac8ff;
  }
  :global([data-theme="dark"]) .value {
    color: #a2e4ce;
  }
</style>
