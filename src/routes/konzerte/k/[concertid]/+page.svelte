<!-- TODO: Dynamic back button -->
<script lang="ts">
  import { page } from "$app/state";
  import ArrowUpRight from "$lib/assets/ArrowUpRight.svelte";
  import ChevronLeft from "$lib/assets/ChevronLeft.svelte";
  import PlaceholderConcertImage from "$lib/assets/PlaceholderConcertImage.svelte";
  import ContentContainer from "$lib/components/ContentContainer.svelte";
  import { eventStore, getVenueById } from "$lib/stores/events.svelte";
  import { formatGermanDateTime } from "$lib/utils/concerts";
  import { onMount } from "svelte";
  import type { ClassValue } from "svelte/elements";
  import { fade, slide } from "svelte/transition";

  let { supabase, imageName } = $derived(page.data);

  let concert = $state<Concert>();
  let venue = $state<VenueDetails>();
  let imageUrl = $derived(imageName ? `/images/${imageName}` : null);
  let error = $state<string | null>(null);

  onMount(async () => {
    let _concert = eventStore.concerts.get(page.params.concertid);
    if (!_concert) {
      const { data, error: fetchError } = await supabase
        .from("concerts")
        .select("*")
        .eq("id", page.params.concertid)
        .single();

      if (fetchError) {
        console.error("Error fetching concert:", fetchError);
        error = "Konzert nicht gefunden.";
        return;
      }
      _concert = data as Concert;
    }

    concert = _concert;

    // Fetch venue information for public concerts
    if (concert?.venue_id && concert.type === "public") {
      let _venue = getVenueById(concert.venue_id);
      if (!_venue) {
        const { data: venueData, error: venueError } = await supabase
          .from("venues")
          .select("*")
          .eq("id", concert.venue_id)
          .single();

        if (!venueError && venueData) {
          _venue = venueData;
        } else {
          console.error("Error fetching venue:", venueError);
          error = "Veranstaltungsort nicht gefunden.";
          return;
        }
      }

      venue = structuredClone(_venue as VenueDetails);
    }
  });
</script>

{#snippet backBtn(additionalClasses: ClassValue = "")}
  <button
    class="dy-btn dy-btn-soft dy-btn-primary h-10 w-fit transition-all duration-300 {additionalClasses}"
    onclick={() => history.back()}
  >
    <ChevronLeft class="size-6" />
    Zurück
  </button>
{/snippet}

<ContentContainer maxWidth={900}>
  <div class="w-full space-y-4 p-2 pt-4">
    {@render backBtn("sm:hidden sm:opacity-0 opacity-100")}
    <div class="big-concert-card">
      {#if error}
        <div class="dy-alert dy-alert-error dy-alert-vertical w-full" transition:fade>
          <h1 class="text-xl font-bold">Fehler</h1>
          <div class="font-mono">{error}</div>
        </div>
        <div class="mx-auto my-4">
          {@render backBtn("dy-btn-sm")}
        </div>
      {:else if !concert}
        <span class="dy-loading dy-loading-dots mx-auto my-4"></span>
      {:else}
        <figure class="relative aspect-[21/9] overflow-hidden">
          {@render backBtn("absolute top-2 left-2  hidden sm:inline-flex opacity-0 sm:opacity-100")}
          {#if imageUrl}
            <img src={imageUrl} class="size-full object-cover" alt={concert.name ?? "Privates Konzert"} />
          {:else}
            <PlaceholderConcertImage class="size-full object-cover" />
          {/if}
        </figure>
        <section
          class="flex w-full flex-col items-start gap-5 px-3 py-4 sm:px-5"
          transition:slide={{ axis: "y" }}
        >
          <div class="flex flex-col gap-2">
            <h2 class="text-2xl font-bold text-balance">{concert.name || "Privates Konzert"}</h2>
            <span class="dy-badge dy-badge-md dy-badge-primary">
              {formatGermanDateTime(concert.timestamp)}
            </span>

            {#if concert.type === "closed"}
              <span class="dy-badge dy-badge-secondary">Geschlossene Veranstaltung</span>
            {/if}
          </div>

          {#if concert.type === "public"}
            <!-- Venue Information -->
            {#if venue}
              <div class="flex flex-col gap-1">
                <h3 class="un-force text-lg font-semibold">Veranstaltungsort</h3>
                <p class="text-base-content/80">{venue.name}</p>
                <p class="text-base-content/60 text-sm">{venue.address}</p>
                <p class="text-base-content/60 text-sm">{venue.postal_code} {venue.city}</p>
                {#if venue.url}
                  <a
                    href={venue.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="dy-btn dy-btn-xs dy-btn-outline dy-btn-primary mt-2"
                  >
                    Webseite
                    <ArrowUpRight class="size-4" />
                  </a>
                {/if}
              </div>
            {/if}

            <!-- Pricing Information -->
            {#if concert.free || concert.price !== null || concert.abendkasse}
              <div class="flex flex-col gap-2">
                <h3 class="un-force text-lg font-semibold">Eintritt</h3>
                <div class="flex flex-wrap items-center gap-2">
                  {#if concert.free}
                    <p class="dy-badge dy-badge-success dy-badge-lg">Eintritt frei</p>
                  {:else if concert.price !== null}
                    <p class="dy-badge dy-badge-outline dy-badge-lg font-mono">
                      {concert.price} €
                    </p>
                  {/if}

                  {#if concert.abendkasse}
                    <span class="dy-badge dy-badge-info">Abendkasse verfügbar</span>
                  {/if}
                </div>
              </div>
            {/if}

            <!-- Ticket Link -->
            {#if concert.ticket_url}
              <div class="flex flex-col gap-2">
                <h3 class="un-force text-lg font-semibold">Tickets</h3>
                <a
                  href={concert.ticket_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="dy-btn dy-btn-success dy-btn-wide"
                >
                  Tickets kaufen
                  <ArrowUpRight class="size-4" />
                </a>
              </div>
            {/if}
          {/if}

          <!-- Notes -->
          {#if concert.notes}
            <div class="flex flex-col gap-2">
              <h3 class="un-force text-lg font-semibold">Hinweise</h3>
              <p class="text-base-content/80 text-sm whitespace-pre-wrap">{concert.notes}</p>
            </div>
          {/if}
        </section>
      {/if}
    </div>
  </div>
</ContentContainer>

<style>
  .big-concert-card {
    --light-gray: color-mix(in oklab, var(--color-gray-200) 15%, transparent);
    background-color: var(--color-base-200);
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: auto;
    place-items: start;
    overflow: hidden;
    border-radius: var(--radius-xl);
    box-shadow: 0 4px 6px var(--light-gray);
    margin-bottom: 4rem;
  }
</style>
