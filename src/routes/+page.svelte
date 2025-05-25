<script lang="ts">
  import { goto } from "$app/navigation";
  import ChevronDown from "$lib/assets/ChevronDown.svelte";
  import { eventStore, getVenueById, serializeConcerts } from "$lib/stores.svelte.js";
  import { formatGermanDateTime } from "$lib/utils/concerts";
  import { onMount } from "svelte";

  let banner = $state<HTMLDivElement>();
  let firstSection = $state<HTMLElement>();
  let scrollY = $state<number>(0);
  let innerWidth = $state<number>(720);

  // Handle scroll animation for banner
  function handleScroll() {
    if (banner && firstSection) {
      const firstSectionTop = firstSection.offsetTop - 80; // Adjust for some padding
      const opacity = 1 - Math.min(1, scrollY / (firstSectionTop ?? 500));
      const translateY = scrollY * 0.5;
      banner.style.opacity = opacity.toString();
      banner.style.transform = `translateY(${translateY}px)`;
    }
  }

  onMount(() => {
    window.addEventListener("scroll", () => {
      scrollY = window.scrollY;
      handleScroll();
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  });
</script>

<svelte:window bind:scrollY bind:innerWidth />

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
  <main class="z-10 mt-8 min-h-screen">
    <div bind:this={banner} class="relative max-w-[100%] bg-black">
      <img
        id="banner-image"
        src="/burningdezibelz-banner.png"
        alt="Burning Dezibelz Banner"
        class="mx-auto max-h-screen w-full object-contain"
      />
      <div class="absolute inset-0 flex items-end justify-center bg-transparent py-10">
        <div class="bg-primary/40 border-primary text-primary block animate-bounce rounded-full">
          <ChevronDown class="hidden size-18 rounded-full drop-shadow-md drop-shadow-black lg:block" />
        </div>
      </div>
    </div>

    <section bind:this={firstSection} class="px-4 py-16 md:px-8">
      <div class="container mx-auto">
        {@render heading("konzerte", "Konzerte", "/konzerte")}
        <!-- Usually,  checking the metadata is enough, but we need it for svelte to update it when the data changes -->
        {#if !eventStore.metadata.concertsLoaded && eventStore.concerts.size === 0}
          <div class="flex w-full items-center justify-center">
            <div class="loading loading-spinner loading-lg"></div>
          </div>
        {:else if eventStore.metadata.concertsLoaded && eventStore.concerts.size === 0}
          <div class="text-center text-lg font-semibold">Keine Konzerte gefunden.</div>
        {:else}
          <div class="concert-grid">
            {#each serializeConcerts() as concert}
              {@const venue = getVenueById(concert.venue_id, true)}
              <a
                href={`/konzerte/${concert.id}`}
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
                    <span class="dy-badge switch-colors-primary"
                      >{formatGermanDateTime(concert.timestamp)}</span
                    >
                  </div>
                  {#if concert.notes}
                    <p class="mt-4">
                      {concert.notes}
                    </p>
                  {/if}
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
          {#if eventStore.concerts.size > 5}
            <div class="mt-3 flex justify-center">
              <a href="/konzerte" class="dy-btn dy-btn-soft dy-btn-primary">Mehr</a>
            </div>
          {/if}
        {/if}
      </div>
    </section>

    <section class="px-4 py-16 md:px-8">
      {@render heading("ueber", "Über uns")}
      <div class="dy-card sm:dy-card-side bg-base-100 container mx-auto shadow-sm">
        <figure class="sm:max-w-1/2">
          <img src="/ringkeller_1748128961.png" alt="Album" />
        </figure>
        <div class="dy-card-body">
          <h2 class="dy-card-title">New album is released!</h2>
          <p>Click the button to listen on Spotiwhy app.</p>
          <div class="dy-card-actions justify-end">
            <button class="dy-btn dy-btn-primary">Listen</button>
          </div>
        </div>
      </div>
    </section>
  </main>
</div>

<style>
  #banner-image {
    max-height: calc(100vh - 80px);
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
