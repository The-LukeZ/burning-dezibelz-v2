<script lang="ts">
  import { goto } from "$app/navigation";
  import { EventMetadata, EventStore, serializeConcerts } from "$lib/stores/events.svelte.js";
  import { copyConcertLink } from "$lib/utils/concerts.js";
  import { formatGermanDateTime, getConcertDisplayName } from "$lib/utils/concerts.js";

  let loading = $state(false);

  function showConcertDetails(concertId: string) {
    goto(`/dash/concerts/edit/${concertId}`);
  }

  async function handleDelete(concertId: string) {
    loading = true;
    const res = await fetch(`/api/concerts/${concertId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      EventStore.concerts.delete(concertId);
    } else {
      const error = await res.json();
      console.error("Error deleting concert:", error);
    }
    loading = false;
  }
</script>

<div class="flex flex-col items-center justify-between gap-2 md:flex-row">
  <h1 class="text-2xl font-bold">Concert Management (Upcoming)</h1>
  <div class="ml-auto grid grid-cols-1 items-center gap-2 md:grid-cols-2">
    <a href="/dash/concerts/archive" class="dy-btn dy-btn-soft dy-btn-success dy-btn-sm">
      📦 Archived Concerts
    </a>
    <a href="/dash/concerts/new" class="dy-btn dy-btn-soft">Add Concert</a>
  </div>
</div>

<div class="overflow-x-auto">
  <table class="dy-table dy-table-zebra table w-full min-w-md">
    <thead>
      <tr>
        <th>Date</th>
        <th>Type</th>
        <th>Name</th>
        <th>Venue</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {#if EventMetadata.concertsLoaded && EventStore.concerts.size > 0}
        {#each serializeConcerts() as concert}
          <tr
            id={concert.id}
            class="hover:bg-primary/15 cursor-pointer transition-colors duration-75"
            onclick={() => showConcertDetails(concert.id)}
          >
            <td>{formatGermanDateTime(concert.timestamp)}</td>
            <td>
              <pre>{concert.type === "closed" ? "Geschlossen" : "Öffentlich"}</pre>
            </td>
            {#if concert.type === "public"}
              <td>{getConcertDisplayName(concert)}</td>
              <td>
                {concert.venue_id
                  ? (EventStore.venues?.get(concert.venue_id)?.name ?? "Unknown Venue")
                  : "No Venue"}
              </td>
            {:else}
              <td colspan="2" class="dy-glass border-0 text-center">Privates Konzert</td>
            {/if}
            <td class="flex w-min flex-row gap-1">
              <button
                class="dy-btn dy-btn-sm dy-btn-error dy-btn-outline w-auto"
                disabled={loading}
                onclickcapture={async (e) => {
                  e.stopPropagation();
                  if (confirm("Are you sure you want to delete this concert?\nID: " + concert.id)) {
                    await handleDelete(concert.id);
                  }
                }}
              >
                Delete
              </button>
              <button
                class="dy-btn dy-btn-sm dy-btn-info dy-btn-outline w-auto"
                onclickcapture={async (e) => {
                  e.stopPropagation();
                  await copyConcertLink(
                    concert.id,
                    concert.venue_id ? EventStore.venues.get(concert.venue_id)?.name : null,
                  );
                }}
              >
                Share
              </button>
            </td>
          </tr>
        {/each}
      {:else if EventMetadata.concertsLoaded && EventStore.concerts.size === 0}
        <tr>
          <td colspan="5" class="text-center">No concerts found.</td>
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
