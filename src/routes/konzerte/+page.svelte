<script lang="ts">
  import { buildImageUrl } from "$lib";
  import Lock from "$lib/assets/Lock.svelte";
  import PlaceholderConcertImage from "$lib/assets/PlaceholderConcertImage.svelte";
  import Head from "$lib/components/Head.svelte";
  import SiteHeader from "$lib/components/SiteHeader.svelte";
  import { EventMetadata, EventStore, serializeConcerts } from "$lib/stores/events.svelte";
  import { concertHref, filterConcerts, formatGermanDateTime } from "$lib/utils/concerts.js";

  const filteredConcerts = $derived<ConcertWithDetails[]>(
    filterConcerts(serializeConcerts(), {
      after: new Date(),
      limit: 100,
    }).map((concert) => ({
      ...concert,
      venue: concert.venue_id ? (EventStore.venues.get(concert.venue_id) ?? null) : null,
    })),
  );
</script>

<Head
  seo_config={{
    title: "Anstehende Konzerte | Burning Dezibelz",
    description: "Verpasse keine Konzerte der Burning Dezibelz!",
    url: "https://burningdezibelz.de/konzerte",
    site_name: "Anstehende Konzerte | Burning Dezibelz",
    author_name: "Burning Dezibelz",
    language: "de",
  }}
/>

<SiteHeader title="Anstehende Konzerte" />
<div class="mb-4 flex justify-center">
  <a href="/konzerte/archiv" class="dy-btn dy-btn-outline dy-btn-sm dy-btn-primary">
    📦 Archivierte Konzerte ansehen
  </a>
</div>

<section>
  {#if !EventMetadata.concertsLoaded && EventStore.concerts.size === 0}
    <span class="dy-loading dy-loading-dots mx-auto my-3"></span>
  {:else if EventMetadata.concertsLoaded && EventStore.concerts.size === 0}
    <p class="mx-auto my-3">Keine anstehenden Konzerte gefunden.</p>
  {:else}
    {#each filteredConcerts as concert}
      {@const isPublic = concert.type === "public"}
      {@const concertTitle = isPublic ? concert.name : "Privates Konzert"}
      <div
        class="dy-card w-full max-w-96 bg-(--color-light-base-100) shadow-sm transition duration-150 hover:-translate-y-1"
      >
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
