<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { buildImageUrl } from "$lib";
  import ChevronDown from "$lib/assets/ChevronDown.svelte";
  import ChevronLeft from "$lib/assets/ChevronLeft.svelte";
  import Trashcan from "$lib/assets/Trashcan.svelte";
  import XIcon from "$lib/assets/XIcon.svelte";
  import ImageSelector from "$lib/components/ImageSelector.svelte";
  import SelectVenue from "$lib/components/SelectVenue.svelte";
  import { EventStore } from "$lib/stores/events.svelte";
  import type { Database } from "$lib/supabase";
  import { formatDateTimeLocal } from "$lib/utils/concerts.js";
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";

  let { supabase } = page.data;
  let { data: pageData } = $props();

  // Yes, concert can be null, but since error handling is done, we can safely assume it's not null here.
  let concert = $state(pageData.concert);
  let ticketModes = $state({
    online: concert?.ticket_url ? true : false,
    abendkasse: concert?.abendkasse ? true : false,
    free: concert?.free ? true : false,
  });

  let venueSelector = $state({ open: false });
  let loading = $state(false);
  let error = $state<string | null>(pageData.error || null);
  let images = $state<DBImage[]>([]);
  let imageSelect = $state<{
    open: boolean;
    image: DBImage | null;
  }>({
    open: false,
    image: null,
  });

  function handleImageSelect(image: DBImage) {
    if (!concert) return;
    concert.image = image.id;
    imageSelect.image = image;
  }

  function switchConcertType() {
    if (!concert) return;
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
    if (!EventStore.concerts || !concert) {
      error = "Concert data is not available???";
      console.error("Concert data is not available???", EventStore.concerts, concert);
      return;
    }
    loading = true;
    error = null;

    // Validate required fields
    if (
      !concert ||
      concert.timestamp === "" ||
      (concert.type === "public" &&
        !(
          concert.name &&
          concert.venue_id &&
          (ticketModes.online || ticketModes.abendkasse || ticketModes.free)
        ))
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
      const concertData: Database["public"]["Tables"]["concerts"]["Update"] = {
        name: concert.name,
        type: concert.type,
        venue_id: concert.venue_id,
        notes: concert.notes,
        timestamp: new Date(concert.timestamp).toISOString(),
        abendkasse: ticketModes.abendkasse,
        free: ticketModes.free,
        price: ticketModes.free ? null : concert.price,
        ticket_url: ticketModes.online ? concert.ticket_url : null,
        image: concert.type === "closed" ? null : (concert.image ?? null),
      };

      const response = await fetch(`/api/concerts/${concert.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(concertData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to update concert");
      }

      const newConcert = (await response.json()) as Concert;
      EventStore.concerts.delete(concert.id); // Remove old concert if it exists (ID can change)
      EventStore.concerts.set(newConcert.id, newConcert);

      // Navigate back to concerts list on success
      goto("/dash/concerts");
    } catch (err: any) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  onMount(async () => {
    if (pageData.error) return;
    // Fetch images for the ImageSelector
    const { data: _images, error: fetchError } = await supabase
      .from("images")
      .select("*")
      .eq("status", "completed")
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("Error fetching images:", fetchError);
      error = fetchError.message;
      return;
    }

    images = _images || [];
  });
</script>

{#if concert}
  <div class="container mx-auto flex h-full max-w-xl flex-col gap-3">
    <a href={pageData.backUrl} class="dy-btn dy-btn-soft dy-btn-sm dy-btn-info w-fit">
      <ChevronLeft />
      Go back
    </a>
    <h1 class="text-2xl font-bold">Update Concert</h1>

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
        value={formatDateTimeLocal(concert.timestamp)}
        class="dy-input dy-input-warning"
        placeholder="Select date and time"
        onchange={(e) => {
          concert.timestamp = e.currentTarget.value;
        }}
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
                  {@const venue = EventStore.venues.get(concert.venue_id)}
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

    <fieldset class="dy-fieldset">
      <legend class="dy-fieldset-legend">Concert Image</legend>
      {#if imageSelect.image && concert.type !== "closed"}
        {@const addOpacity = (e: { currentTarget: HTMLDivElement }) =>
          e.currentTarget.classList.add("opacity-100", "bg-black/30")}
        {@const removeOpacity = (e: { currentTarget: HTMLDivElement }) =>
          e.currentTarget.classList.remove("opacity-100", "bg-black/30")}
        <div class="relative h-32 w-44 overflow-hidden rounded-lg shadow-md">
          <img
            src={buildImageUrl(imageSelect.image.r2_key, { width: 128, height: 96, fit: "cover" })}
            alt={imageSelect.image.name || "Concert Image"}
            class="dy-skeleton h-full w-full object-cover"
          />
          <div
            class="absolute top-0 right-0 bottom-0 left-0 grid place-items-center opacity-0 transition-opacity duration-150"
            role="button"
            tabindex="0"
            onmouseover={addOpacity}
            onmouseout={removeOpacity}
            onfocus={addOpacity}
            onblur={removeOpacity}
          >
            <button
              class="dy-btn dy-btn-circle transition"
              onclick={() => {
                concert.image = null;
                imageSelect.image = null;
              }}
            >
              <XIcon />
            </button>
          </div>
        </div>
      {:else}
        <button class="dy-btn dy-btn-outline" onclick={() => (imageSelect.open = true)}>Select Image</button>
      {/if}
    </fieldset>

    <div class="mt-2 flex flex-row justify-end gap-4">
      <button class="dy-btn dy-btn-error" onclick={() => goto("/dash/concerts")}>Cancel</button>
      <button class="dy-btn dy-btn-primary" disabled={loading} onclick={handleSubmit}>
        {loading ? "Updating..." : "Update Concert"}
      </button>
    </div>
  </div>
{/if}

{#if error}
  <div class="dy-toast dy-toast-top dy-toast-center mt-14" transition:fade>
    <div class="dy-alert dy-alert-error">
      <span>{error}</span>
    </div>
  </div>
{/if}

<ImageSelector {images} onselect={handleImageSelect} bind:show={imageSelect.open} />

<div class="hidden">
  {#each images as image}
    <img
      src={buildImageUrl(image.r2_key, { width: 128, height: 96, fit: "cover" })}
      alt={image.name || "Image"}
      class="dy-skeleton h-32 w-44 object-cover"
    />
  {/each}
</div>
