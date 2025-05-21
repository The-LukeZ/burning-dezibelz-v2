<script lang="ts">
  import { eventStore } from "$lib/stores.svelte.js";

  let { data } = $props();

  let selectedConcert = $state<Concert | null>(null);
  let venue = $derived.by<VenueDetails | null>(() => {
    let loc: VenueDetails | null = null;
    if (selectedConcert && eventStore.venues !== null) {
      loc = eventStore.venues.get(selectedConcert.venue_id) ?? null;
    }
    return loc;
  });
  let dialogElement = $state<HTMLDialogElement>();

  function showConcertDetails(concert: Concert) {
    selectedConcert = concert;
    dialogElement?.showModal();
  }

  function closeDialog() {
    dialogElement?.close();
    selectedConcert = null; // Optional: clear selection on close
  }

  function getConcertDisplayName(concert: Concert): string {
    if (concert.name) {
      return concert.name;
    }
    const venue = eventStore.venues?.get(concert.venue_id) ?? null;
    return venue?.name || "Unknown Location";
  }

  function formatGermanDateTime(dateString: string | null): string {
    if (!dateString) return "N/A";
    try {
      const timestamp = new Date(dateString);
      return timestamp.toLocaleString("de-DE", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Berlin",
      });
    } catch (e) {
      return "Invalid Date";
    }
  }
</script>

<div class="flex flex-row">
  <h1 class="mb-4 text-2xl font-bold">Concert Management</h1>
  <a href="/dash/concerts/new" class="dy-btn dy-btn-soft ml-auto">Add Concert</a>
</div>

<div class="overflow-x-auto">
  <table class="dy-table dy-table-zebra table w-full">
    <thead>
      <tr>
        <th>Date</th>
        <th>Name</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {#if eventStore.concerts !== null && eventStore.concerts.size > 0}
        {#each Array.from(eventStore.concerts.entries()) as [concertId, concert]}
          <tr class="dy-hover" onclick={() => showConcertDetails(concert)}>
            <td>{formatGermanDateTime(concert.timestamp)}</td>
            <td>{getConcertDisplayName(concert)}</td>
            <td>
              <button
                class="dy-btn dy-btn-xs dy-btn-outline"
                onclick={(e) => {
                  e.stopPropagation();
                  showConcertDetails(concert);
                }}
              >
                View Details
              </button>
            </td>
          </tr>
        {/each}
      {:else if eventStore.concerts !== null && eventStore.concerts.size === 0}
        <tr><td colspan="3">No concerts found.</td></tr>
      {/if}
    </tbody>
  </table>
</div>

<dialog bind:this={dialogElement} class="dy-modal">
  <div class="dy-modal-box w-11/12 max-w-2xl">
    {#if selectedConcert}
      <h3 class="mb-2 text-lg font-bold">
        {getConcertDisplayName(selectedConcert)}
      </h3>
      <p class="py-1"><strong>ID:</strong> {selectedConcert.id}</p>
      <p class="py-1"><strong>Date:</strong> {formatGermanDateTime(selectedConcert.timestamp)}</p>
      <p class="py-1"><strong>Location ID:</strong> {selectedConcert.venue_id}</p>
      {#if venue}
        <div class="py-1">
          <strong>Location Details:</strong>
          <ul class="ml-4 list-inside list-disc">
            <li>Name: {venue.name}</li>
            <li>Address: {venue.address}, {venue.postal_code} {venue.city}, {venue.country}</li>
            {#if venue.url}
              <li>URL: <a href={venue.url} target="_blank" class="dy-link">{venue.url}</a></li>
            {/if}
          </ul>
        </div>
      {/if}
      {#if selectedConcert.notes}
        <p class="py-1"><strong>Notes:</strong></p>
        <ul class="ml-4 list-inside list-disc">
          {#each selectedConcert.notes.split("\n") as note}
            <li>{note}</li>
          {/each}
        </ul>
      {/if}
      <div class="py-1">
        <strong>Tickets:</strong>
        {#if selectedConcert.tickets.free}
          <p>Free entry</p>
        {:else if "price" in selectedConcert.tickets && selectedConcert.tickets.price !== null}
          <p>Price: {selectedConcert.tickets.price} EUR</p>
          {#if selectedConcert.tickets.url}
            <p>
              URL: <a href={selectedConcert.tickets.url} target="_blank" class="dy-link"
                >{selectedConcert.tickets.url}</a
              >
            </p>
          {/if}
          {#if selectedConcert.tickets.abendkasse}
            <p>Available at the box office (Abendkasse)</p>
          {/if}
        {:else}
          <p>Ticket information not fully available.</p>
        {/if}
      </div>
      <!-- You can add more fields from the concert object as needed -->
      <pre class="bg-base-200 mt-2 overflow-x-auto rounded-md p-2 text-xs">
         {JSON.stringify(selectedConcert, null, 2)}
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
