<script lang="ts">
  import ChevronDown from "$lib/assets/ChevronDown.svelte";
  import { eventStore, getVenueById, serializeConcerts } from "$lib/stores.svelte.js";
  import { formatDateTimeLocal, formatGermanDateTime } from "$lib/utils/concerts";
  import { onMount } from "svelte";

  let banner = $state<HTMLDivElement>();
  let scrollY = $state<number>(0);

  // Handle scroll animation for banner
  function handleScroll() {
    if (banner) {
      const opacity = 1 - Math.min(1, scrollY / 550);
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

<svelte:window bind:scrollY />

{#snippet heading(id: string, title: string, href: string)}
  <h1 {id} class="mb-4 text-center text-3xl font-bold">
    <a {href} class="text-primary hover:underline">
      {title}
    </a>
  </h1>
{/snippet}

<div id="gradient-start-point" class="relative w-full bg-linear-to-b from-black to-transparent">
  <main class="mt-5 min-h-screen">
    <div bind:this={banner} class="relative max-w-[100%] self-center overflow-hidden bg-black">
      <img
        src="/burningdezibelz_logo.png"
        alt="Burning Dezibelz Banner"
        class="mx-auto max-h-screen w-full object-contain"
      />
      <div class="absolute inset-0 flex items-end justify-center bg-transparent py-10">
        <div class="bg-primary/40 border-primary text-primary block animate-bounce rounded-full">
          <ChevronDown class="hidden size-18 rounded-full drop-shadow-md drop-shadow-black lg:block" />
        </div>
      </div>
    </div>

    <section class="bg-base-200 px-4 py-16 md:px-8">
      <div class="container mx-auto">
        {@render heading("konzerte", "Konzerte", "/konzerte")}
        {#if !eventStore.metadata.concertsLoaded}
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
                class="dy-card concert-card bg-(--color-light-base-100) shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl"
              >
                <!-- TODO: Add image display -->
                <div class="dy-card-body">
                  {#if concert.type === "public"}
                    <h3 class="dy-card-title text-xl">{concert.name}</h3>
                    <p class="text-lg">{venue.city}, {venue.state}</p>
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
                      <a href={concert.ticket_url} class="text-primary hover:underline">Tickets verfügbar</a>
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
  </main>
</div>

<style>
  .concert-grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1rem;

    > .concert-card {
      flex: 0 1 400px;
    }
  }
</style>
