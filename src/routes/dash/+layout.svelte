<script lang="ts">
  import { eventStore, fetchConcerts, fetchVenues } from "$lib/stores.svelte";
  import { onMount } from "svelte";

  let { children } = $props();

  onMount(async () => {
    if (eventStore.concerts === null) {
      await fetchConcerts({});
    }
    if (eventStore.venues === null) {
      await fetchVenues();
    }
  });
</script>

<div class="dy-navbar bg-base-200 justify-center shadow-sm">
  <a href="/dash/concerts" class="dy-btn dy-btn-ghost text-lg">Concerts</a>
  <a href="/dash/venues" class="dy-btn dy-btn-ghost text-lg">Venues</a>
</div>

<div class="container mx-auto p-4">
  {@render children()}
</div>
