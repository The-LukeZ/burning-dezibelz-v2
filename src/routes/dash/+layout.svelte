<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { isCurrentPage } from "$lib";
  import ChevronLeft from "$lib/assets/ChevronLeft.svelte";
  import { eventStore, fetchConcerts, fetchVenues } from "$lib/stores.svelte";
  import { onMount } from "svelte";

  let { children } = $props();

  let isLoginPage = $derived(page.url.pathname.includes("login"));

  const navItems = [
    { href: "/dash", label: "Dash Home" },
    { href: "/dash/concerts", label: "Concerts" },
    { href: "/dash/venues", label: "Venues" },
    { href: "/dash/songs", label: "Songs" },
    { href: "/dash/users", label: "Users" },
  ];

  onMount(async () => {
    if (eventStore.metadata.concertsLoaded === false) {
      await fetchConcerts({
        after: new Date(),
      });
    }
    if (eventStore.metadata.venuesLoaded === false) {
      await fetchVenues();
    }
  });
</script>

{#snippet navbarLinks()}
  {#each navItems as item}
    <li>
      <a href={item.href} class:dy-menu-active={isCurrentPage(item.href, page.url)}>{item.label}</a>
    </li>
  {/each}
{/snippet}

{#if !isLoginPage}
  <div class="dy-navbar bg-base-100 shadow-sm">
    <div class="mx-auto flex h-full w-full max-w-[1280px] items-center justify-between">
      <div class="dy-navbar-start">
        <a class="dy-btn dy-btn-secondary dy-btn-square dy-btn-outline" href="/">
          <ChevronLeft class="site-10" />
        </a>
      </div>
      <div class="dy-navbar-center hidden md:flex">
        <ul class="dy-menu dy-menu-horizontal dy-menu-lg px-1">
          {@render navbarLinks()}
        </ul>
      </div>
      <div class="dy-dropdown dy-dropdown-center">
        <div tabindex="0" role="button" class="dy-btn dy-btn-ghost md:hidden">
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
              d="M4 6h16M4 12h8m-8 6h16"
            />
          </svg>
        </div>
        <ul
          class="dy-menu dy-menu-lg dy-dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 drop-shadow-lg"
        >
          {@render navbarLinks()}
        </ul>
      </div>
      <div class="dy-navbar-end">
        <button
          class="dy-btn dy-btn-error dy-btn-outline"
          onclick={() => goto("/dash/logout")}
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
            ><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /><path
              d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
            /></svg
          >
        </button>
      </div>
    </div>
  </div>
{/if}

<div class="mx-auto p-4" class:mt-14={!isLoginPage}>
  {@render children()}
</div>

<style>
  .dy-navbar {
    li > a {
      text-align: center;
      justify-content: center;
    }

    ul {
      gap: 0.2rem;
      font-weight: var(--font-weight-semibold);
    }
  }
</style>
