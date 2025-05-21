<script lang="ts">
  import { page } from "$app/state";
  import { eventStore } from "$lib/stores.svelte.js";
  import { svelte } from "@sveltejs/vite-plugin-svelte";

  let { data } = $props();

  let selectedVenue = $state<VenueDetails | null>(null);
  let dialogElement = $state<HTMLDialogElement>();

  function showVenueDetails(venue: VenueDetails) {
    selectedVenue = venue;
    dialogElement?.showModal();
  }

  function closeDialog() {
    dialogElement?.close();
    setTimeout(() => {
      selectedVenue = null;
    }, 100);
  }
</script>

<!-- TODO
- Make Modal.svelte
- Exchange with <dialog> element
- Add form controls to edit venue details
- Add "Save" button to save changes
- Add "Delete" button to delete venue
- Add "Cancel" button to close modal without saving
- Add hover animation for each row
-->

<div class="flex flex-row">
  <h1 class="mb-4 text-2xl font-bold">Venue Management</h1>
  <a href="/dash/venues/new" class="dy-btn dy-btn-soft ml-auto">Add Venue</a>
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
      {#if eventStore.venues !== null && eventStore.venues.size > 0}
        {#each Array.from(eventStore.venues.entries()) as [venueId, venue]}
          <tr class="dy-hover" onclick={() => showVenueDetails(venue)}>
            <td>{venue.name}</td>
            <td>{venue.city}, {venue.country}</td>
            <td>
              <button
                class="dy-btn dy-btn-sm dy-btn-outline"
                onclick={(e) => {
                  e.stopPropagation();
                  showVenueDetails(venue);
                }}
              >
                View Details
              </button>
            </td>
          </tr>
        {/each}
      {:else if eventStore.venues !== null && eventStore.venues.size === 0}
        <tr>
          <td colspan="3">No venues found.</td>
        </tr>
      {/if}
    </tbody>
  </table>
</div>

<dialog bind:this={dialogElement} class="dy-modal">
  <div class="dy-modal-box w-11/12 max-w-2xl">
    {#if selectedVenue}
      <h3 class="mb-2 text-lg font-bold">{selectedVenue.name}</h3>
      <p class="py-1"><strong>ID:</strong> {selectedVenue.id}</p>
      <div class="py-1">
        <strong>Address:</strong>
        <p>{selectedVenue.address}</p>
        <p>{selectedVenue.postal_code} {selectedVenue.city}</p>
        <p>{selectedVenue.country}</p>
      </div>
      {#if selectedVenue.url}
        <p class="py-1">
          <strong>URL:</strong>
          <a href={selectedVenue.url} target="_blank" class="dy-link">{selectedVenue.url}</a>
        </p>
      {/if}

      <pre class="bg-base-200 mt-2 overflow-x-auto rounded-md p-2 text-xs">{JSON.stringify(
          selectedVenue,
          null,
          2,
        )}
       </pre>
    {/if}
    <div class="dy-modal-action">
      <button class="dy-btn dy-btn-primary" onclick={closeDialog}>Close</button>
    </div>
  </div>
  <form method="dialog" class="dy-modal-backdrop">
    <button onclick={closeDialog}>close</button>
  </form>
</dialog>
