<script>
  import { page } from "$app/state";
  import { isCurrentPage } from "$lib";

  const navItems = [
    { href: "/konzerte", label: "Konzerte" },
    { href: "/ueber-uns", label: "Über uns" },
    { href: "/kontakt", label: "Kontakt" },
  ];
</script>

<div class="dy-navbar fixed top-0 right-0 left-0 z-50 h-16 bg-transparent shadow-sm backdrop-blur-2xl">
  <div class="mx-auto flex h-full w-full max-w-[1280px] items-center justify-between">
    <div class="navbar-branding md:w-1/2">
      <a href="/" class="branding hover:bg-primary/20 rounded px-2 py-1.5 transition hover:text-orange-50">
        <img src="/favicon.ico" alt="Burning Dezibelz Logo" class="size-10" />
        <span class="text-2xl font-bold">Burning Dezibelz</span>
      </a>
    </div>

    {#snippet navbarLinks()}
      {#each navItems as item}
        <li>
          <a href={item.href} class:dy-menu-active={isCurrentPage(item.href, page.url)}>{item.label}</a>
        </li>
      {/each}
    {/snippet}

    <div class="dy-navbar-end dy-dropdown-end w-fit">
      <ul class="dy-menu dy-menu-horizontal hidden gap-1 px-1 text-lg font-semibold md:flex">
        {@render navbarLinks()}
      </ul>
      <div class="dy-dropdown">
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
          class="dy-menu dy-menu-xl dy-dropdown-content bg-base-200 rounded-box mobile-menu z-1 mt-3 p-2 drop-shadow-lg"
        >
          {@render navbarLinks()}
        </ul>
      </div>
    </div>
  </div>
</div>

<style>
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
    width: calc(100vw - (11 / 12) * 100%);
    a {
      justify-content: center;
      width: 100%;
    }
  }
</style>
