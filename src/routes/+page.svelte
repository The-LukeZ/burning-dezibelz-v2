<script lang="ts">
  import { goto } from "$app/navigation";
  import ChevronDown from "$lib/assets/ChevronDown.svelte";
  import type { SeoConfig } from "$lib/components/Head.svelte";
  import Head from "$lib/components/Head.svelte";
  import AboutSchemaOrg from "$lib/components/SchemaOrgs/About.svelte";
  import { EventMetadata, EventStore, getVenueById, serializeConcerts } from "$lib/stores/events.svelte.js";
  import { formatGermanDateTime } from "$lib/utils/concerts.js";

  let banner = $state<HTMLDivElement>();
  let firstSection = $state<HTMLElement>();
  let scrollY = $state<number>(0);

  // Handle scroll animation for banner
  function handleScroll() {
    if (banner && firstSection) {
      const firstSectionTop = firstSection.offsetTop - 100; // Adjust for some padding
      const opacity = 1 - Math.min(1, scrollY / firstSectionTop);
      const translateY = scrollY * 0.5;
      banner.style.opacity = opacity.toString();
      banner.style.transform = `translateY(${translateY}px)`;
    }
  }

  $effect(handleScroll);

  const seo_config: SeoConfig = {
    title: "Burning Dezibelz - Rock & Metal Band aus Zwickau",
    description:
      "Entdecke die Burning Dezibelz, eine junge Rock- und Metal-Band aus Zwickau. Konzerte, Musik, Gallerie und mehr!",
    url: "https://burningdezibelz.de",
    author_name: "Burning Dezibelz",
    language: "de",
    open_graph_image: "https://burningdezibelz.de/band_bild_2025-05-28.jpg",
    open_graph_image_alt: "Burning Dezibelz Banner",
    site_name: "Burning Dezibelz",
    twitter_card_type: "summary_large_image",
    website: "https://burningdezibelz.de",
  };
</script>

<Head {seo_config} />
<AboutSchemaOrg />

<svelte:window bind:scrollY />

{#snippet heading(id: string, title: string, href: string | null = null)}
  <h1 {id} class="mb-4 text-center text-3xl font-bold">
    {#if href === null}
      <span class="text-primary">
        {title}
      </span>
    {:else}
      <a {href} class="text-primary hover:underline">
        {title}
      </a>
    {/if}
  </h1>
{/snippet}

<div id="gradient-start-point" class="bg-base-300 relative w-full">
  <main class="z-10 min-h-screen">
    <div bind:this={banner} class="relative max-w-[100%] bg-black">
      <span class="h-8 w-full bg-black"></span>
      <img
        id="banner-image"
        src="/burningdezibelz-banner.webp"
        alt="Burning Dezibelz Banner"
        class="mx-auto max-h-screen w-full object-contain"
      />
      <div class="absolute inset-0 flex items-end justify-center bg-transparent py-10">
        <button
          class="bg-primary/0 border-primary text-primary hover:bg-primary/40 block animate-bounce cursor-pointer rounded-full transition duration-150"
          onclick={() => {
            firstSection?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          <ChevronDown class="hidden size-18 rounded-full drop-shadow-md drop-shadow-black lg:block" />
        </button>
      </div>
    </div>

    <section bind:this={firstSection} class="px-4 py-16 md:px-8">
      <div class="container mx-auto">
        {@render heading("konzerte", "Konzerte", "/konzerte")}
        <!-- Usually,  checking the metadata is enough, but we need it for svelte to update it when the data changes -->
        {#if !EventMetadata.concertsLoaded && EventStore.concerts.size === 0}
          <div class="flex w-full items-center justify-center">
            <div class="loading loading-spinner loading-lg"></div>
          </div>
        {:else if EventMetadata.concertsLoaded && EventStore.concerts.size === 0}
          <div class="text-center text-lg font-semibold">Keine Konzerte gefunden.</div>
        {:else}
          <div class="concert-grid">
            {#each serializeConcerts() as concert}
              {@const venue = getVenueById(concert.venue_id, true)}
              <a
                href={`/konzerte/k/${concert.id}`}
                class="dy-card concert-card shadow-xl transition-all duration-200 hover:scale-105 hover:shadow-2xl"
              >
                <!-- TODO: Add image display -->
                <div class="dy-card-body">
                  {#if concert.type === "public"}
                    <h3 class="dy-card-title text-xl">{concert.name}</h3>
                    <p class="text-lg">{venue.city}</p>
                  {:else}
                    <h3 class="dy-card-title text-xl">Private Veranstaltung</h3>
                  {/if}
                  <div class="mt-2 flex cursor-default items-center gap-2">
                    <span class="dy-badge switch-colors-primary">
                      {formatGermanDateTime(concert.timestamp)}
                    </span>
                  </div>
                  {#if concert.ticket_url}
                    <p class="mt-4">
                      <button
                        class="text-primary hover:underline"
                        onclick={(e) => {
                          e.stopPropagation();
                          if (concert.ticket_url) goto(concert.ticket_url);
                        }}
                      >
                        Tickets verfügbar
                      </button>
                    </p>
                  {/if}
                </div>
              </a>
            {/each}
          </div>
          {#if EventStore.concerts.size > 5}
            <div class="mt-3 flex justify-center">
              <a href="/konzerte" class="dy-btn dy-btn-soft dy-btn-primary">Mehr</a>
            </div>
          {/if}
        {/if}
      </div>
    </section>

    <section class="px-4 py-16 md:px-8">
      {@render heading("ueber", "Über uns")}
      <div class="dy-card sm:dy-card-side bg-base-100 container mx-auto max-w-[1000px] shadow-sm">
        <figure class="sm:max-w-1/2">
          <img src="/ringkeller_1748128961.webp" alt="Im Ringkeller, März 2025" />
        </figure>
        <div class="dy-card-body short-about justify-around sm:text-lg">
          <h2 class="dy-card-title block text-2xl font-bold text-balance">
            Wir sind die <strong>Burning Dezibelz</strong>!
          </h2>
          <p>
            Eine junge Band aus dem schönen <span class="font-bold">Zwickau</span>, wobei sich "jung" nur auf
            das Alter der Band bezieht, denn uns gibt es erst seit <strong>2023</strong>.<br />
            Jan und Micha sorgen an den Gitarren für die Melodien, Robert am Bass und Luca am Schlagzeug für den
            Groove.<br />
            Musikalisch sind wir zu Hause zwischen <strong>Rock</strong> und <strong>Metal</strong>, mit
            Ausflügen in alles, was dazwischen spielt.
          </p>
          <div class="dy-card-actions mt-3 justify-end">
            <a href="/ueber-uns" class="dy-btn dy-btn-primary">Erfahre mehr über uns</a>
          </div>
        </div>
      </div>
    </section>
  </main>
</div>

<style>
  #banner-image {
    max-height: 100vh;
  }

  .concert-grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1rem;

    > .concert-card {
      flex: 0 1 400px;
      background-color: var(--color-light-base-100);
    }
  }

  section {
    z-index: 10;
  }
</style>
