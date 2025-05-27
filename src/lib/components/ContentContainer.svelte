<script lang="ts">
  import type { Snippet } from "svelte";

  let { children }: { children?: Snippet } = $props();
</script>

<div class="content-container">
  {@render children?.()}
</div>

<style>
  .content-container {
    height: 100%;
    width: 100%;
    max-width: 1200px;
    margin-inline: auto;
  }
</style>
