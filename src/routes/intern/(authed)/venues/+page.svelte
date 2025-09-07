<script lang="ts">
  import { goto } from "$app/navigation";
  import { EventMetadata, EventStore, serializeVenues } from "$lib/stores/events.svelte.js";

  let loading = $state(false);

  async function handleDelete(venueId: string) {
    loading = true;
    const res = await fetch(`/api/venues/${venueId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      EventStore.venues?.delete(venueId);
    } else {
      const error = await res.json();
      console.error("Error deleting venue:", error);
    }
    loading = false;
  }

  function showVenueDetails(venueId: string) {
    goto(`/intern/venues/edit/${venueId}`);
  }
</script>

<div class="flex flex-row">
  <h1 class="mb-4 text-2xl font-bold">Venue Management</h1>
  <a href="/intern/venues/new" class="dy-btn dy-btn-soft ml-auto">Add Venue</a>
</div>

<div class="overflow-x-auto">
  <table class="dy-table dy-table-zebra table w-full min-w-md">
    <thead>
      <tr>
        <th>Name</th>
        <th>Location</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {#if EventStore.venues.size > 0}
        {#each serializeVenues() as venue}
          <tr
            class="hover:bg-primary/15 cursor-pointer transition-colors duration-75"
            onclick={() => showVenueDetails(venue.id)}
          >
            <td>{venue.name}</td>
            <td>{venue.city}, {venue.country}</td>
            <td class="flex">
              <button
                class="dy-btn dy-btn-sm dy-btn-error dy-btn-outline w-full sm:w-auto"
                disabled={loading}
                onclickcapture={async (e) => {
                  e.stopPropagation();
                  if (confirm("Are you sure you want to delete this venue?\nID: " + venue.id)) {
                    await handleDelete(venue.id);
                  }
                }}
              >
                Delete
              </button>
            </td>
          </tr>
        {/each}
      {:else if EventMetadata.venuesLoaded && EventStore.venues.size === 0}
        <tr>
          <td colspan="5" class="text-center">No venues found.</td>
        </tr>
      {:else}
        <tr>
          <td colspan="5" class="text-center">
            <span class="dy-loading dy-loading-dots"></span>
          </td>
        </tr>
      {/if}
    </tbody>
  </table>
</div>
