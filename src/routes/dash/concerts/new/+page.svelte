<script lang="ts">
  import { goto } from "$app/navigation";
  import ChevronDown from "$lib/assets/ChevronDown.svelte";
  import Trashcan from "$lib/assets/Trashcan.svelte";
  import XIcon from "$lib/assets/XIcon.svelte";
  import SelectVenue from "$lib/components/SelectVenue.svelte";
  import { eventStore } from "$lib/stores.svelte";
  import type { Database, Tables } from "$lib/supabase";
  import { fade } from "svelte/transition";

  let concert = $state<Omit<Database["public"]["Tables"]["concerts"]["Insert"], "id">>({
    timestamp: "",
    type: "public",
    venue_id: "",
    name: "",
    notes: "",
    abendkasse: false,
    free: false,
    price: 0,
    ticket_url: "",
  });

  let ticketModes = $state({
    online: false,
    abendkasse: false,
    free: false,
  });
  let venueSelector = $state({ open: false });
  let loading = $state(false);
  let error = $state<string | null>(null);

  function switchConcertType() {
    concert.type = concert.type === "public" ? "closed" : "public";
    if (concert.type === "closed") {
      concert.ticket_url = null;
      concert.free = false;
      concert.price = null;
      concert.abendkasse = false;
      concert.venue_id = null;
      concert.name = "";
    } else {
      concert.name = "";
      concert.price = 0;
    }
  }

  async function handleSubmit() {
    if (!eventStore.concerts) return console.error("Concert Map null???");
    loading = true;
    error = null;

    // Validate required fields
    if (
      concert.timestamp === "" ||
      (concert.type === "public" && !concert.name) ||
      (concert.type === "public" && !concert.venue_id) ||
      (ticketModes.online && !concert.ticket_url) ||
      (ticketModes.online && concert.price && concert.price <= 0)
    ) {
      error = "Please fill in all required fields.";
      loading = false;
      setTimeout(() => {
        error = null;
      }, 3000);
      return;
    }

    try {
      // Convert datetime-local to ISO string
      const concertData: Omit<Database["public"]["Tables"]["concerts"]["Insert"], "id"> = {
        name: concert.name,
        type: concert.type,
        venue_id: concert.venue_id,
        notes: concert.notes,
        timestamp: new Date(concert.timestamp).toISOString(),
        abendkasse: ticketModes.abendkasse,
        free: ticketModes.free,
        price: ticketModes.free ? null : concert.price,
        ticket_url: ticketModes.online ? concert.ticket_url : null,
      };

      console.log("Concert Data", concertData);

      const response = await fetch("/api/concerts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(concertData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to create concert");
      }

      // Navigate back to concerts list on success
      goto("/dash/concerts");
    } catch (err: any) {
      error = err.message;
    } finally {
      loading = false;
    }
  }
</script>

<div class="container mx-auto flex h-full max-w-xl flex-col gap-3">
  <h1 class="text-2xl font-bold">Add New Concert</h1>

  {#if error}
    <div class="dy-toast dy-toast-top dy-toast-center mt-14" transition:fade>
      <div class="dy-alert dy-alert-error">
        <span>{error}</span>
      </div>
    </div>
  {/if}

  <!-- Switch concert type -->
  <div class="dy-join">
    <button
      class="dy-btn dy-btn-soft dy-join-item"
      class:dy-btn-active={concert.type === "public"}
      onclick={switchConcertType}>Public Concert</button
    >
    <button
      class="dy-btn dy-btn-soft dy-join-item"
      class:dy-btn-active={concert.type === "closed"}
      onclick={switchConcertType}>Closed Concert</button
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
        bind:show={venueSelector.open}
        onselect={(venue) => {
          concert.venue_id = venue.id;
          if (concert.name === "" && venue.name) {
            concert.name = venue.name;
          }
          venueSelector.open = false;
        }}
        clickoutside={() => {
          venueSelector.open = false;
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
            <input type="checkbox" bind:checked={venueSelector.open} />
            <ChevronDown class="dy-swap-off" />
            <XIcon class="dy-swap-on" />
          </label>
          {#if concert.venue_id}
            <button
              class="dy-btn dy-btn-square dy-btn-dash dy-btn-sm"
              onclick={() => {
                concert.venue_id = "";
              }}
            >
              <Trashcan class="size-4" />
            </button>
          {/if}
        </div>
      </SelectVenue>

      <p class="dy-label">
        Venue not here? <a href="/dash/venues/new" class="dy-link hover:text-slate-300"> Add a new venue </a>
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
                if (!ticketModes.online && !ticketModes.abendkasse) {
                  concert.ticket_url = "";
                  concert.price = 0;
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
                if (!ticketModes.online && !ticketModes.abendkasse) {
                  concert.ticket_url = "";
                  concert.price = 0;
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
                if (ticketModes.free) {
                  concert.price = 0;
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
            class="dy-input dy-input-md"
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

  <fieldset class="dy-fieldset">
    <legend class="dy-fieldset-legend">Notes</legend>
    <textarea
      bind:value={concert.notes}
      class="dy-textarea field-sizing-content max-h-50 w-full max-w-xs"
      placeholder="Additional notes for the concert"
      rows="3"
    ></textarea>
  </fieldset>

  <div class="mt-2 flex flex-row justify-end gap-4">
    <button class="dy-btn dy-btn-error" onclick={() => goto("/dash/concerts")}>Cancel</button>
    <button class="dy-btn dy-btn-primary" disabled={loading} onclick={handleSubmit}>
      {loading ? "Creating..." : "Create Concert"}
    </button>
  </div>
</div>
