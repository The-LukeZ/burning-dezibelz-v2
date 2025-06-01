<script lang="ts">
  import SiteHeader from "$lib/components/SiteHeader.svelte";
  import { buildImageUrl } from "$lib";
  import Lock from "$lib/assets/Lock.svelte";
  import PlaceholderConcertImage from "$lib/assets/PlaceholderConcertImage.svelte";
  import { eventStore, serializeConcerts } from "$lib/stores/events.svelte";
  import { concertHref, filterConcerts, formatGermanDateTime } from "$lib/utils/concerts";

  const filteredConcerts = $derived<ConcertWithDetails[]>(
    filterConcerts(serializeConcerts(), {
      after: new Date(),
      limit: 100,
    }).map((concert) => ({
      ...concert,
      venue: concert.venue_id ? (eventStore.venues.get(concert.venue_id) ?? null) : null,
    })),
  );

  let concertsLoaded = $derived(eventStore.metadata.concertsLoaded);
</script>

<SiteHeader title="Anstehende Konzerte" />

<section>
  {#if !concertsLoaded && eventStore.concerts.size === 0}
    <span class="dy-loading dy-loading-dots mx-auto my-3"></span>
  {:else if concertsLoaded && eventStore.concerts.size === 0}
    <p class="mx-auto my-3">Keine anstehenden Konzerte gefunden.</p>
  {:else}
    {#each filteredConcerts as concert}
      {@const isPublic = concert.type === "public"}
      {@const concertTitle = isPublic ? concert.name : "Privates Konzert"}
      <div class="dy-card bg-base-200 w-full max-w-96 shadow-sm transition duration-150 hover:-translate-y-1">
        <figure class="relative aspect-video">
          {#if concert.image}
            <img src={buildImageUrl(concert.image)} alt={concertTitle} class="size-full" />
          {:else}
            <PlaceholderConcertImage class="size-full" />
          {/if}
          <div class="absolute inset-0 grid place-items-center">
            <div class="rounded-full bg-black/55 p-5" class:hidden={isPublic}>
              <Lock class="size-12 text-slate-300" />
            </div>
          </div>
        </figure>
        <div class="dy-card-body justify-start">
          <h2 class="dy-card-title">{concertTitle}</h2>
          <span class="dy-badge dy-badge-primary h-fit">
            {formatGermanDateTime(concert.timestamp)}
          </span>
          {#if isPublic && concert.venue}
            <p>{concert.venue.name}</p>
          {:else if isPublic && !concert.venue}
            <p>Unbekannter Veranstaltungsort</p>
          {/if}

          <div class="dy-card-actions mt-auto justify-end">
            <a
              href={concertHref(concert.id, concert.venue?.name)}
              class="dy-btn dy-btn-secondary"
              target="_self"
              rel="noopener noreferrer"
            >
              Mehr Infos
            </a>
          </div>
        </div>
      </div>
    {/each}
  {/if}
</section>

<style>
  section {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-top: 2rem;
    padding: 1rem;
    justify-content: center;
    align-items: stretch;
  }
</style>
