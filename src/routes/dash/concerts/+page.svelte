<script lang="ts">
  import { goto } from "$app/navigation";
  import ShareConcertBtn from "$lib/components/ShareConcertBtn.svelte";
  import { eventStore, serializeConcerts } from "$lib/stores/events.svelte.js";
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
      eventStore.concerts.delete(concertId);
    } else {
      const error = await res.json();
      console.error("Error deleting concert:", error);
    }
    loading = false;
  }
</script>

<div class="flex flex-row">
  <h1 class="mb-4 text-2xl font-bold">Concert Management</h1>
  <a href="/dash/concerts/new" class="dy-btn dy-btn-soft ml-auto">Add Concert</a>
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
      {#if eventStore.metadata.concertsLoaded && eventStore.concerts.size > 0}
        {#each serializeConcerts() as concert}
          <tr
            id={concert.id}
            class="hover:bg-primary/15 transition-colors duration-75"
            onclickcapture={() => showConcertDetails(concert.id)}
          >
            <td>{formatGermanDateTime(concert.timestamp)}</td>
            <td>
              <pre>{concert.type === "closed" ? "Geschlossen" : "Öffentlich"}</pre>
            </td>
            {#if concert.type === "public"}
              <td>{getConcertDisplayName(concert)}</td>
              <td>
                {concert.venue_id
                  ? (eventStore.venues?.get(concert.venue_id)?.name ?? "Unknown Venue")
                  : "No Venue"}
              </td>
            {:else}
              <td colspan="2" class="dy-glass border-0 text-center">Privates Konzert</td>
            {/if}
            <td class="flex w-min flex-row gap-1">
              <span
                class="dy-btn dy-btn-primary dy-btn-sm dy-btn-outline w-auto"
                class:dy-btn-disabled={loading}
              >
                Edit
              </span>
              <button
                class="dy-btn dy-btn-sm dy-btn-error dy-btn-outline w-auto"
                disabled={loading}
                onclick={async (e) => {
                  e.stopPropagation();
                  if (confirm("Are you sure you want to delete this concert?\nID: " + concert.id)) {
                    await handleDelete(concert.id);
                  }
                }}
              >
                Delete
              </button>
              <ShareConcertBtn
                concertData={concert}
                btnType="info"
                small={true}
                additionalClasses={"dy-btn-outline"}
              />
            </td>
          </tr>
        {/each}
      {:else if eventStore.metadata.concertsLoaded && eventStore.concerts.size === 0}
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
