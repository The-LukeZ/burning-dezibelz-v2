<script lang="ts">
  import { page } from "$app/state";
  import { isCurrentPage } from "$lib";

  const navItems = [
    { href: "/konzerte", label: "Konzerte" },
    { href: "/ueber-uns", label: "Über uns" },
    { href: "/kontakt", label: "Kontakt" },
  ] as const;
</script>

<div
  class="dy-navbar fixed top-0 right-0 left-0 z-50 h-(--navbar-height) bg-transparent shadow-sm backdrop-blur-2xl"
>
  <div class="mx-auto flex h-full w-full max-w-[1280px] items-center justify-between">
    <div class="navbar-branding md:w-1/2">
      <a href="/" class="branding hover:bg-primary/20 rounded px-2 py-1.5 transition hover:text-orange-50">
        <img src="/favicon.ico" alt="Burning Dezibelz Logo" class="size-10" />
        <span class="text-2xl font-bold">Burning Dezibelz</span>
      </a>
    </div>

    <div class="dy-navbar-end dy-dropdown-end w-fit">
      <ul class="dy-menu dy-menu-horizontal hidden items-center gap-1 px-1 text-lg font-semibold sm:flex">
        {#each navItems as item}
          <li>
            <a href={item.href} class="nav-btn" class:active-link={isCurrentPage(item.href, page.url)}>
              {item.label}
            </a>
          </li>
        {/each}
      </ul>
      <div class="dy-dropdown dy-dropdown-end block sm:hidden">
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
          class="dy-dropdown-content dy-menu dy-menu-xl bg-base-200 rounded-box mobile-menu z-1 mt-3 p-2 drop-shadow-lg"
        >
          {#each navItems as item}
            <li>
              <a href={item.href} class="nav-btn" class:active-link={isCurrentPage(item.href, page.url)}>
                {item.label}
              </a>
            </li>
          {/each}
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
    width: calc(100vw - ((11 / 12) * 100%));
    gap: 0.5rem;

    li:not(:last-child) {
      padding-bottom: 5px;
    }

    a {
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
      color: color-mix(in oklab, var(--color-neutral-content) 30%, white);
      background-color: color-mix(in oklab, var(--color-primary) 20%, transparent);
    }

    &:active {
      transform: translateY(1px);
    }
  }
</style>
