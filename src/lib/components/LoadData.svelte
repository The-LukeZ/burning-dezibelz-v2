<script lang="ts">
  // Import this in a layout or page component to ensure data is loaded before rendering
  import { eventStore, fetchConcerts, fetchVenues } from "$lib/stores.svelte";
  import { onMount } from "svelte";

  onMount(async () => {
    if (!eventStore.metadata.concertsLoaded) {
      await fetchConcerts();
    }
    if (!eventStore.metadata.venuesLoaded) {
      await fetchVenues();
    }
  });
</script>
