<script lang="ts">
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
