<script lang="ts">
  import type { Snippet } from "svelte";

  let { children, maxWidth = 1200 }: { children?: Snippet; maxWidth?: number } = $props();
</script>

<div class="content-container" style:max-width="{maxWidth}px">
  {@render children?.()}
</div>

<style>
  .content-container {
    height: 100%;
    width: 100%;
    margin-inline: auto;
  }
</style>
