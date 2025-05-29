<script lang="ts">
  let { children } = $props();
</script>

<div class="dash-container">
  {@render children()}
</div>

<style>
  .dash-container {
    padding: 1rem;
    max-width: 1280px;
    margin-inline: auto;
  }
</style>
