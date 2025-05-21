<script lang="ts">
  import { goto } from "$app/navigation";
  import { eventStore, serializeVenues } from "$lib/stores.svelte";

  let concert = $state<any>({
    date: "",
    type: "public",
    time: "20:00",
    venue_id: "",
    name: "",
    notes: "",
    tickets: {
      price: 0,
      abendkasse: false,
      free: false,
      url: "",
    },
  });

  let ticketModes = $state({
    online: false,
    abendkasse: false,
    free: false,
  });
  let loading = $state(false);
  let error = $state(null);

  function switchConcertType() {
    concert.type = concert.type === "public" ? "closed" : "public";
    if (concert.type === "closed") {
      concert.tickets = {
        price: 0,
        abendkasse: false,
        free: false,
        url: "",
      };
    }
  }

  async function handleSubmit() {
    if (!eventStore.concerts) return console.error("Concert Map null???");
    loading = true;
    error = null;

    try {
      // Combine timestamp and time
      const concertData: Omit<Concert, "id"> = {
        name: concert.name,
        type: concert.type,
        venue_id: concert.venue_id,
        notes: concert.notes,
        timestamp: new Date(`${concert.date}T${concert.time}`).toISOString(),
        tickets: {
          price: concert.tickets.price,
          abendkasse: concert.tickets.abendkasse,
          free: concert.tickets.free,
          url: concert.tickets.url,
        },
      };

      console.log("Concert Data:", concertData);
      return;

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

<div class="container mx-auto flex h-full max-w-xl flex-col gap-4">
  <h1 class="text-2xl font-bold">Add New Concert</h1>

  {#if error}
    <div class="dy-alert dy-alert-error">
      <span>{error}</span>
    </div>
  {/if}

  <fieldset class="dy-fieldset">
    <legend class="dy-fieldset-legend">Name</legend>
    <input
      type="text"
      bind:value={concert.name}
      class="dy-input"
      placeholder="Using location name if not given"
    />
  </fieldset>

  <fieldset class="dy-fieldset">
    <legend class="dy-fieldset-legend">Date & Time</legend>
    <div class="flex flex-col gap-2 sm:flex-row">
      <input type="date" bind:value={concert.date} class="dy-input" placeholder="Date" />
      <input type="time" bind:value={concert.time} class="dy-input sm:max-w-30" placeholder="Time" />
    </div>
  </fieldset>

  <fieldset class="dy-fieldset">
    <legend class="dy-fieldset-legend">Venue</legend>
    <select bind:value={concert.venue_id} class="dy-select">
      <option value="" disabled selected>Select a venue</option>
      {#each serializeVenues() as location}
        <option value={location.id}>{location.name}</option>
      {/each}
    </select>
    <p class="dy-label">
      Venue not here? <a href="/dash/venues/new" class="dy-link hover:text-slate-300"> Add a new venue </a>
    </p>
  </fieldset>

  <fieldset class="dy-fieldset">
    <legend class="dy-fieldset-legend">Notes</legend>
    <textarea
      bind:value={concert.notes}
      class="dy-textarea field-sizing-content max-h-50 w-xl"
      placeholder="Additional notes for the concert"
      rows="3"
    ></textarea>
  </fieldset>

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
                  concert.tickets.url = "";
                  concert.tickets.price = 0;
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
                  concert.tickets.url = "";
                  concert.tickets.price = 0;
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
                  concert.tickets.price = 0;
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
            bind:value={concert.tickets.price}
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
            bind:value={concert.tickets.url}
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

  <div class="mt-2 flex flex-row justify-end gap-4">
    <button class="dy-btn dy-btn-error" onclick={() => goto("/dash/concerts")}>Cancel</button>
    <button class="dy-btn dy-btn-primary" disabled={loading} onclick={handleSubmit}>
      {loading ? "Creating..." : "Create Concert"}
    </button>
  </div>
</div>
