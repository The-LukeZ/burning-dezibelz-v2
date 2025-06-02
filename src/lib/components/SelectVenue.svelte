<script lang="ts">
  import { EventMetadata, EventStore } from "$lib/stores/events.svelte";
  import type { Snippet } from "svelte";
  import type { ClassValue } from "svelte/elements";
  import { scale } from "svelte/transition";

  type Props = {
    /**
     * An array of venue IDs to exclude from the selection.
     */
    exclude?: string[];
    show: boolean;
    class?: ClassValue;
    /**
     * Callback function to be called when a venue is selected.
     * @param venue The selected venue.
     */
    onselect?: (venue: VenueDetails) => void;
    clickoutside?: () => void;
    /**
     * The children to which the popup will be anchored.
     */
    children: Snippet;
  };

  let {
    exclude = [],
    show = $bindable(false),
    onselect = (venue) => {
      console.warn("No handler defined!", venue);
    },
    clickoutside = () => {
      show = false;
    },
    children,
    class: className = "",
  }: Props = $props();

  let search = $state("");
  let filteredVenues = $derived.by(() => {
    if (!EventMetadata.venuesLoaded) return null;
    const venueMap = $state.snapshot(EventStore.venues);
    const filtered = venueMap.values().filter((venue) => {
      if (exclude.includes(venue.id)) return false;
      if (search === "") return true;
      return (
        venue.name.toLowerCase().includes(search.toLowerCase()) ||
        venue.city.toLowerCase().includes(search.toLowerCase()) ||
        venue.postal_code.toLowerCase().includes(search.toLowerCase()) ||
        venue.address.toLowerCase().includes(search.toLowerCase()) ||
        venue.state.toLowerCase().includes(search.toLowerCase())
      );
    });
    return Array.from(filtered);
  });

  $effect(() => {
    if (show) {
      document.body.style.overflow = "hidden";
      document.body.style.pointerEvents = "none";
    } else {
      document.body.style.overflow = "";
      document.body.style.pointerEvents = "";
    }
  });
</script>

<div class="relative {className} pointer-events-auto">
  {@render children()}
  {#if show}
    <!-- Transparent backdrop -->
    <!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
    <div class="backdrop" onclick={clickoutside} transition:scale={{ duration: 100 }}></div>
    <div class="popup" transition:scale={{ duration: 100 }}>
      <div class="popup-inner">
        {#if !filteredVenues}
          <p class="dy-btn dy-btn-disabled">Loading...</p>
        {:else}
          <label class="dy-input dy-input-sm rounded-md">
            <svg class="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <g
                stroke-linejoin="round"
                stroke-linecap="round"
                stroke-width="2.5"
                fill="none"
                stroke="currentColor"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.3-4.3"></path>
              </g>
            </svg>
            <input type="search" placeholder="Search channel" bind:value={search} />
          </label>
          <div class="bg-base-200 border-base-200 mt-1 size-full overflow-y-auto rounded-md border-2">
            <div class="grid w-full grid-cols-1 gap-2 p-1">
              {#if filteredVenues.length > 0}
                {#each filteredVenues as venue}
                  <div class="w-full" id={venue.id}>
                    <button
                      class="dy-btn dy-btn-soft dy-btn-primary dy-btn-sm w-full"
                      onclick={() => onselect(venue)}
                    >
                      {venue.name}
                    </button>
                  </div>
                {/each}
              {:else}
                <p class="dy-btn dy-btn-disabled">No venues found</p>
              {/if}
            </div>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  /* TODO: How to keep popup within the screen (JS...) */

  .popup {
    display: block;
    position: absolute;
    margin-top: 4px;
    left: 0;
    z-index: 1000;
    background-color: var(--color-base-300);
    border-radius: var(--radius-box);
    border: 10px solid var(--color-base-300);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    width: 300px;
    height: 400px;
    overflow: hidden;
    transition: all 100ms ease-in-out;
  }

  .popup-inner {
    display: grid;
    grid-template-rows: auto 1fr;
    gap: 4px;
    width: 100%;
    height: 100%;
    overflow-y: hidden;
    padding: 4px;
    z-index: 1000;
  }

  .backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    /* background-color: rgba(0, 0, 0, 0.5); */
    background-color: transparent;
    z-index: 999;
  }
</style>
