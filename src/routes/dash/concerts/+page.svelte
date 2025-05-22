<script lang="ts">
  import ChevronDown from "$lib/assets/ChevronDown.svelte";
  import Trashcan from "$lib/assets/Trashcan.svelte";
  import XIcon from "$lib/assets/XIcon.svelte";
  import Modal from "$lib/components/Modal.svelte";
  import SelectVenue from "$lib/components/SelectVenue.svelte";
  import { eventStore, metadata, serializeConcerts } from "$lib/stores.svelte.js";
  import type { Database, Tables } from "$lib/supabase.ts";
  import { formatDateTimeLocal, formatGermanDateTime, getConcertDisplayName } from "$lib/utils/concerts.js";

  type Concert = Tables<"concerts">;

  let concert = $state<Concert | null>(null);
  let ticketModes = $state({
    online: false,
    abendkasse: false,
    free: false,
  });
  let modalState = $state<{
    open: boolean;
    tab: "edit" | "raw";
    venueSelectorOpen: boolean;
  }>({
    open: false,
    tab: "edit",
    venueSelectorOpen: false,
  });
  let loading = $state(false);

  function showConcertDetails(_concert: Concert) {
    concert = { ..._concert, timestamp: formatDateTimeLocal(_concert.timestamp) }; // Create a copy for editing
    ticketModes.online = !!_concert.ticket_url;
    ticketModes.abendkasse = _concert.abendkasse;
    ticketModes.free = _concert.free;
    modalState.venueSelectorOpen = false;
    modalState.tab = "edit";
    modalState.open = true;
  }

  function closeDialog() {
    modalState.open = false;
    setTimeout(() => {
      concert = null;
      ticketModes = {
        online: false,
        abendkasse: false,
        free: false,
      };
    }, 150);
  }

  function switchConcertType(newType: "public" | "closed") {
    return () => {
      if (!concert) return;
      concert.type = newType;
      if (concert.type === "closed") {
        concert.venue_id = "";
        concert.ticket_url = "";
        concert.price = 0;
      }
    };
  }

  function setConcertVenue(venue: { id: string; name: string }) {
    if (!concert) return;
    concert.venue_id = venue.id;
    if (concert.name === "") {
      concert.name = venue.name;
    }
    modalState.venueSelectorOpen = false;
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

  async function handleEdit(concertId: string) {
    if (!eventStore.concerts) return console.error("Concert Map null???");
    loading = true;

    // Validate required fields

    const _concert = $state.snapshot(concert);
    const _ticketModes = $state.snapshot(ticketModes);

    let error: string = "";
    if (_concert && !_concert.timestamp) error += "\n- Date and time are required.";
    if (_concert?.type === "public") {
      if (!_concert.name) error += "\n- Name is required.";
      if (!_concert.venue_id) error += "\n- Venue is required.";
      if (!_ticketModes.online && !_ticketModes.abendkasse && !_ticketModes.free)
        error += "\n- At least one ticket mode is required.";
      if (_ticketModes.online && !_concert.ticket_url) error += "\n- Ticket URL is required.";
      if ((_ticketModes.online || _ticketModes.abendkasse) && _concert.price === 0)
        error += "\n- Price is required (must be positive).";
    }

    // error is always given when there is no concert, this is just for the type check
    if (error || _concert === null) {
      alert("Please fill all required fields!" + error);
      loading = false;
      return;
    }

    console.log("Concert", _concert);
    console.log("Ticket Modes", _ticketModes);

    try {
      // Convert datetime-local to ISO string
      const concertData: Database["public"]["Tables"]["concerts"]["Update"] = {
        name: _concert.name,
        type: _concert.type,
        venue_id: _concert.venue_id,
        notes: _concert.notes,
        timestamp: new Date(_concert.timestamp).toISOString(),
        abendkasse: _ticketModes.abendkasse,
        free: _ticketModes.free,
        price: _ticketModes.free ? null : _concert.price,
        ticket_url: _ticketModes.online ? _concert.ticket_url : null,
      };

      console.log("Concert Data", concertData);

      const res = await fetch(`/api/concerts/${concertId}`, {
        method: "PUT",
        body: JSON.stringify(concertData),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const updatedConcert = await res.json();
        eventStore.concerts.set(concertId, updatedConcert);
        console.log("Updated concert:", updatedConcert);
      } else {
        const error = await res.json();
        console.error("Error updating concert:", error);
      }
    } catch (err: any) {
      console.error("Error:", err);
    } finally {
      loading = false;
      closeDialog();
    }
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
      {#if metadata.concertsLoaded && eventStore.concerts.size > 0}
        {#each serializeConcerts() as concert}
          <tr class="hover:bg-primary/15 transition-colors duration-75">
            <td>{formatGermanDateTime(concert.timestamp)}</td>
            <td
              colspan={concert.type === "closed" ? 3 : 1}
              class={concert.type === "closed" ? "dy-glass text-center" : ""}
            >
              <pre>{concert.type === "closed" ? "Geschlossen" : "Öffentlich"}</pre>
            </td>
            {#if concert.type === "public"}
              <td>{getConcertDisplayName(concert)}</td>
              <td>
                {concert.venue_id
                  ? (eventStore.venues?.get(concert.venue_id)?.name ?? "Unknown Venue")
                  : "No Venue"}
              </td>
            {/if}
            <td class="flex flex-col gap-1 sm:flex-row">
              <button
                class="dy-btn dy-btn-primary dy-btn-sm dy-btn-outline w-full sm:w-auto"
                disabled={loading}
                onclick={(e) => {
                  e.stopPropagation();
                  showConcertDetails(concert);
                }}
              >
                Details
              </button>
              <button
                class="dy-btn dy-btn-sm dy-btn-error dy-btn-outline w-full sm:w-auto"
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
            </td>
          </tr>
        {/each}
      {:else if metadata.concertsLoaded && eventStore.concerts.size === 0}
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

<Modal bind:open={modalState.open} withXButton={false} class="w-full max-w-3xl sm:min-w-lg">
  <div class="dy-join mb-4">
    <button
      name="details"
      class="dy-join-item dy-btn dy-btn-secondary"
      class:dy-btn-active={modalState.tab === "edit"}
      onclick={() => (modalState.tab = "edit")}
    >
      Edit
    </button>
    <button
      name="details"
      class="dy-join-item dy-btn dy-btn-secondary"
      class:dy-btn-active={modalState.tab === "raw"}
      onclick={() => (modalState.tab = "raw")}
    >
      Raw
    </button>
  </div>

  {#if concert !== null}
    <div class="flex w-full max-w-md flex-col" class:hidden={modalState.tab !== "edit"}>
      <!-- Switch concert type -->
      <div class="dy-join mb-4">
        <button
          class="dy-btn dy-btn-soft dy-join-item"
          class:dy-btn-active={concert.type === "public"}
          onclick={switchConcertType("public")}>Public Concert</button
        >
        <button
          class="dy-btn dy-btn-soft dy-join-item"
          class:dy-btn-active={concert.type === "closed"}
          onclick={switchConcertType("closed")}>Closed Concert</button
        >
      </div>

      {#if concert.type === "public"}
        <fieldset class="dy-fieldset">
          <legend class="dy-fieldset-legend">Name</legend>
          <input
            type="text"
            bind:value={concert.name}
            class="dy-input dy-input-warning"
            placeholder="Using location name if not given"
          />
        </fieldset>
      {/if}

      <fieldset class="dy-fieldset">
        <legend class="dy-fieldset-legend">Date & Time</legend>
        <input
          type="datetime-local"
          bind:value={concert.timestamp}
          class="dy-input dy-input-warning"
          placeholder="Select date and time"
        />
      </fieldset>

      {#if concert.type === "public"}
        <fieldset class="dy-fieldset">
          <legend class="dy-fieldset-legend">Venue</legend>
          <SelectVenue
            bind:show={modalState.venueSelectorOpen}
            onselect={setConcertVenue}
            clickoutside={() => {
              modalState.venueSelectorOpen = false;
            }}
            exclude={concert.venue_id ? [concert.venue_id] : []}
          >
            <div class="flex flex-row items-center justify-start gap-2">
              <div class="dy-input dy-input-warning items-center pr-1">
                {#key concert.venue_id}
                  {#if concert.venue_id}
                    {@const venue = eventStore.venues.get(concert.venue_id)}
                    {venue ? venue.name : "Venue not found"}
                  {:else}
                    Select a venue
                  {/if}
                {/key}
              </div>
              <label class="dy-btn dy-btn-circle dy-swap dy-swap-rotate">
                <input type="checkbox" bind:checked={modalState.venueSelectorOpen} />
                <ChevronDown class="dy-swap-off" />
                <XIcon class="dy-swap-on" />
              </label>
              {#if concert.venue_id}
                <button
                  class="dy-btn dy-btn-square dy-btn-dash dy-btn-sm"
                  onclick={() => {
                    concert!.venue_id = null;
                  }}
                >
                  <Trashcan class="size-4" />
                </button>
              {/if}
            </div>
          </SelectVenue>

          <p class="dy-label">
            Venue not here? <a href="/dash/venues/new" class="dy-link hover:text-slate-300">
              Add a new venue
            </a>
          </p>
        </fieldset>

        <fieldset class="dy-fieldset">
          <legend class="dy-fieldset-legend">Tickets Settings</legend>
          <div style="grid-template: 1fr auto / 1fr;" class="mb-4">
            <div class="flex flex-col gap-4 sm:flex-row">
              <label class="dy-label">
                <input
                  type="checkbox"
                  checked={ticketModes.online}
                  class="dy-checkbox"
                  onclick={() => {
                    ticketModes.online = !ticketModes.online;
                    console.log("Online Ticket changed", ticketModes.online);
                    if (!ticketModes.online && !ticketModes.abendkasse) {
                      concert!.ticket_url = "";
                      concert!.price = 0;
                    }
                  }}
                  disabled={ticketModes.free}
                />
                With Ticket URL
              </label>
              <label class="dy-label">
                <input
                  type="checkbox"
                  checked={ticketModes.abendkasse}
                  class="dy-checkbox"
                  onclick={() => {
                    ticketModes.abendkasse = !ticketModes.abendkasse;
                    console.log("Abendkasse changed", ticketModes.abendkasse);
                    if (!ticketModes.online && !ticketModes.abendkasse) {
                      concert!.ticket_url = "";
                      concert!.price = 0;
                    }
                  }}
                  disabled={ticketModes.free}
                />
                Abendkasse
              </label>
              <label class="dy-label">
                <input
                  type="checkbox"
                  checked={ticketModes.free}
                  class="dy-checkbox"
                  onclick={() => {
                    ticketModes.free = !ticketModes.free;
                    console.log("Free Entry changed", ticketModes.free);
                    if (ticketModes.free) {
                      concert!.price = 0;
                      ticketModes.online = false;
                      ticketModes.abendkasse = false;
                    }
                  }}
                  disabled={ticketModes.online || ticketModes.abendkasse}
                />
                Free Entry
              </label>
            </div>
          </div>

          {#if ticketModes.online || ticketModes.abendkasse}
            <!-- Price -->
            <label class="dy-floating-label">
              <span>Price</span>
              <input
                type="number"
                step="0.01"
                placeholder="Price"
                class="dy-input dy-input-md max-w-40"
                bind:value={concert.price}
              />
            </label>
          {/if}

          {#if ticketModes.online}
            <!-- URL -->
            <label class="dy-floating-label">
              <span>Ticket URL</span>
              <input
                type="url"
                placeholder="Ticket URL"
                class="dy-input dy-input-md"
                bind:value={concert.ticket_url}
                required
              />
            </label>
          {/if}
        </fieldset>
      {:else}
        <fieldset class="dy-fieldset">
          <legend class="dy-fieldset-legend">Private Concert</legend>
          <p class="dy-label">This concert is private and not open to the public.</p>
        </fieldset>
      {/if}

      <fieldset class="dy-fieldset w-full max-w-xs">
        <legend class="dy-fieldset-legend">Notes</legend>
        <textarea
          bind:value={concert.notes}
          class="dy-textarea field-sizing-content max-h-50 w-full"
          placeholder="Additional notes for the concert"
          rows="3"
        ></textarea>
      </fieldset>
    </div>

    <div
      class="bg-base-200 mt-3 w-auto max-w-md overflow-x-auto rounded-md p-2 text-sm"
      class:hidden={modalState.tab !== "raw"}
    >
      <pre>{JSON.stringify(concert, null, 2)}</pre>
    </div>

    <div class="mt-6 flex flex-row justify-center gap-4">
      <button class="dy-btn dy-btn-error" onclick={closeDialog}>Cancel</button>
      <button class="dy-btn dy-btn-primary" disabled={loading} onclick={() => handleEdit(concert!.id)}>
        {loading ? "Saving..." : "Save"}
      </button>
    </div>
  {/if}
</Modal>
