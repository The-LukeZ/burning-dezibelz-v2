<script lang="ts">
  import Modal from "$lib/components/Modal.svelte";
  import { eventStore, serializeVenues } from "$lib/stores.svelte.js";

  let selectedVenue = $state<VenueDetails | null>(null);
  let modalOpen = $state(false);
  let modalTab = $state<"edit" | "raw">("edit");
  let loading = $state(false);

  function showVenueDetails(venue: VenueDetails) {
    selectedVenue = venue;
    modalTab = "edit";
    modalOpen = true;
  }

  function closeDialog() {
    modalOpen = false;
    setTimeout(() => {
      selectedVenue = null;
    }, 150);
  }

  async function handleDelete(venueId: string) {
    loading = true;
    const res = await fetch(`/api/venues/${venueId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      eventStore.venues?.delete(venueId);
    } else {
      const error = await res.json();
      console.error("Error deleting venue:", error);
    }
    loading = false;
  }

  async function handleEdit(venueId: string) {
    loading = true;
    const res = await fetch(`/api/venues/${venueId}`, {
      method: "PUT",
      body: JSON.stringify(selectedVenue),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (res.ok) {
      const updatedVenue = await res.json();
      eventStore.venues?.set(venueId, updatedVenue);
      console.log("Updated venue:", updatedVenue);
    } else {
      const error = await res.json();
      console.error("Error updating venue:", error);
    }
    loading = false;
  }
</script>

<!-- TODO
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
      {#if eventStore.venues.size > 0}
        {#each serializeVenues() as venue}
          <tr class="hover:bg-primary/15 transition-colors duration-75">
            <td>{venue.name}</td>
            <td>{venue.city}, {venue.country}</td>
            <td class="flex flex-col gap-1 sm:flex-row">
              <button
                class="dy-btn dy-btn-primary dy-btn-sm dy-btn-outline w-full sm:w-auto"
                disabled={loading}
                onclick={(e) => {
                  e.stopPropagation();
                  showVenueDetails(venue);
                }}
              >
                Details
              </button>
              <button
                class="dy-btn dy-btn-sm dy-btn-error dy-btn-outline w-full sm:w-auto"
                disabled={loading}
                onclick={async (e) => {
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
      {:else if eventStore.metadata.venuesLoaded && eventStore.venues.size === 0}
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

<Modal bind:open={modalOpen} class="max-w-3xl">
  <div class="dy-join mb-4">
    <button
      name="details"
      class="dy-join-item dy-btn dy-btn-secondary"
      class:dy-btn-active={modalTab === "edit"}
      onclick={() => (modalTab = "edit")}
    >
      Edit
    </button>
    <button
      name="details"
      class="dy-join-item dy-btn dy-btn-secondary"
      class:dy-btn-active={modalTab === "raw"}
      onclick={() => (modalTab = "raw")}
    >
      Raw
    </button>
  </div>

  {#if selectedVenue}
    <div class="flex w-full max-w-md flex-col" class:hidden={modalTab !== "edit"}>
      <p class="py-1"><b>ID:</b> {selectedVenue.id}</p>
      <fieldset class="dy-fieldset">
        <legend class="dy-fieldset-legend">Name</legend>
        <input
          type="text"
          name="name"
          bind:value={selectedVenue.name}
          class="dy-input"
          placeholder="Venue Name"
        />
      </fieldset>

      <fieldset class="dy-fieldset">
        <legend class="dy-fieldset-legend">Address</legend>
        <input
          type="text"
          name="address"
          bind:value={selectedVenue.address}
          class="dy-input"
          placeholder="Example Straße 31"
        />
      </fieldset>

      <fieldset class="dy-fieldset">
        <legend class="dy-fieldset-legend">City</legend>
        <div class="flex flex-row gap-2">
          <input
            type="text"
            name="postal_code"
            bind:value={selectedVenue.postal_code}
            class="dy-input w-28"
            placeholder="12345"
          />
          <input
            type="text"
            name="city"
            bind:value={selectedVenue.city}
            class="dy-input grow"
            placeholder="Zwickau"
          />
        </div>
      </fieldset>

      <fieldset class="dy-fieldset">
        <legend class="dy-fieldset-legend">State</legend>
        <input
          type="text"
          name="state"
          bind:value={selectedVenue.state}
          class="dy-input"
          placeholder="Sachsen"
        />
      </fieldset>

      <fieldset class="dy-fieldset">
        <legend class="dy-fieldset-legend">Country</legend>
        <input
          type="text"
          name="country"
          bind:value={selectedVenue.country}
          class="dy-input"
          placeholder="Deutschland"
        />
        <p class="dy-label dy-label-info">Edit this if you know what you're doing.</p>
      </fieldset>

      <fieldset class="dy-fieldset">
        <legend class="dy-fieldset-legend">Venue URL</legend>
        <input
          type="text"
          name="url"
          bind:value={selectedVenue.url}
          class="dy-input"
          placeholder="https://example.com"
        />
        <p class="dy-label dy-label-info">Leave blank to remove it. Trailing slashes will be removed.</p>
      </fieldset>
    </div>

    <div
      class="bg-base-200 mt-3 w-auto max-w-md overflow-x-auto rounded-md p-2 text-sm"
      class:hidden={modalTab !== "raw"}
    >
      <pre>{JSON.stringify(selectedVenue, null, 2)}</pre>
    </div>
  {/if}

  <div class="mt-6 flex justify-center gap-3">
    <button
      class="dy-btn dy-btn-primary dy-btn-wide"
      disabled={loading}
      onclick={async () => {
        if (selectedVenue) {
          await handleEdit(selectedVenue.id);
          closeDialog();
        }
      }}
    >
      Save
    </button>
  </div>
</Modal>
