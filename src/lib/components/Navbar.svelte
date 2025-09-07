<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { isCurrentPage } from "$lib";
  import ChevronLeft from "$lib/assets/ChevronLeft.svelte";
  import { getItemsForPath } from "$lib/data/navigationData";
  import { EventMetadata, EventStore, fetchConcerts, fetchVenues } from "$lib/stores/events.svelte";
  import equal from "fast-deep-equal";
  import { onMount } from "svelte";

  let isDashboard = $derived(page.url.pathname.startsWith("/intern"));
  let userIsAdmin = $derived(page.data.isAdmin);
  let oldItems: NavItem[] = [];
  let navItems = $state<NavItem[]>([]);

  $effect(() => {
    console.log("Is user admin?", $state.snapshot(userIsAdmin));
  });

  // To prevent unnecessary re-renders, we only update navItems if the items for the current path change
  $effect(() => {
    const currentPath = page.url.pathname;
    const newItems = getItemsForPath(currentPath);
    if (!equal(oldItems, newItems)) {
      console.log("Updating nav items for path:", currentPath);
      oldItems = newItems;
      navItems = [...newItems];
    }
  });

  onMount(async () => {
    if (EventMetadata.concertsLoaded === false) {
      const res = await fetchConcerts({
        after: new Date(),
      });

      if (Array.isArray(res)) {
        for (const concert of res) {
          EventStore.concerts.set(concert.id, concert);
        }
        console.log("Fetched concerts:", $state.snapshot(EventStore.concerts));
        EventMetadata.concertsLoaded = true;
      }
    }

    if (EventMetadata.venuesLoaded === false) {
      await fetchVenues();
    }
  });
</script>

{#snippet navbarLinks()}
  {#each navItems as item}
    <li>
      <a
        href={item.href}
        class="nav-btn"
        class:active-link={isCurrentPage(item, page.url)}
        class:hidden={item.requiresAdmin && !userIsAdmin}
      >
        {item.label}
      </a>
    </li>
  {/each}

  {#if isDashboard && page.url.pathname !== "/intern/login"}
    <button
      class="dy-btn dy-btn-error dy-btn-outline"
      onclick={() => goto("/intern/logout")}
      aria-label="Logout"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="m16 17 5-5-5-5" />
        <path d="M21 12H9" />
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      </svg>
    </button>
  {/if}
{/snippet}

<nav class="dy-navbar fixed top-0 right-0 left-0 z-50 h-(--navbar-height) bg-black/15 backdrop-blur-md">
  <div class="mx-auto flex h-full w-full max-w-[1280px] items-center justify-between">
    {#if !isDashboard}
      <div class="navbar-branding md:w-1/2">
        <a href="/" class="branding hover:bg-primary/20 rounded px-2 py-1.5 transition hover:text-orange-50">
          <img src="/favicon.ico" alt="Burning Dezibelz Logo" class="size-10" />
          <span class="text-xl font-bold sm:text-2xl">Burning Dezibelz</span>
        </a>
      </div>
    {:else}
      <div class="dy-navbar-start w-fit">
        <a class="dy-btn dy-btn-secondary dy-btn-square dy-btn-outline" href="/">
          <ChevronLeft />
        </a>
      </div>
    {/if}

    <div class="dy-navbar-end {isDashboard ? 'w-full' : 'w-fit'}">
      <ul
        class="dy-menu dy-menu-horizontal hidden items-center gap-1 px-1 text-lg font-semibold {isDashboard
          ? 'md:flex'
          : 'sm:flex'}"
      >
        {@render navbarLinks()}
      </ul>
      <div class="dy-dropdown dy-dropdown-end {isDashboard ? 'md:hidden' : 'sm:hidden'}">
        <div tabindex="0" role="button" class="dy-btn dy-btn-primary dy-btn-soft dy-btn-square">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h7"
            />
          </svg>
        </div>
        <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
        <ul
          tabindex="0"
          class="dy-dropdown-content dy-menu dy-menu-xl bg-base-300 rounded-box mobile-menu mt-3 p-2 drop-shadow-lg drop-shadow-white/15"
        >
          {@render navbarLinks()}
        </ul>
      </div>
    </div>
  </div>
</nav>

<style>
  nav {
    padding-inline: 1rem;
    border-bottom: 1px solid var(--color-stone-950);
  }

  .branding {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
    width: fit-content;
  }

  .navbar-branding {
    display: inline-flex;
    align-items: center;
    justify-content: flex-start;
    gap: 0.5rem;
  }

  .mobile-menu {
    width: calc(100vw - ((11 / 12) * 100%));
    gap: 0.5rem;
    z-index: 100;

    li:not(:last-child) {
      padding-bottom: 5px;
    }

    a,
    button {
      background-color: color-mix(in oklab, var(--color-light-base-100) 60%, transparent);
      justify-content: center;
      width: 100%;
    }
  }

  ul {
    font-weight: var(--font-weight-semibold);
  }

  .nav-btn {
    color: var(--color-base-content);
    &:hover,
    &.active-link {
      color: var(--color-slate-100);
      background-color: color-mix(in oklab, var(--color-primary) 50%, var(--color-base-200));
    }

    &:active {
      transform: translateY(1px);
    }
  }
</style>
