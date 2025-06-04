<script lang="ts">
  import { page } from "$app/state";
  import { formatGermanDateTime } from "$lib/utils/concerts";
  import { navItems as _navitems } from "$lib/data/navigationData";
  import { goto } from "$app/navigation";
  const navItems = _navitems.private;
</script>

<section class="dy-prose mx-auto cursor-default px-4 py-8">
  <div
    class="dy-avatar dy-avatar-placeholder mb-4 aspect-square size-24 rounded-full shadow-xl shadow-gray-600/25 select-none"
  >
    <div class="dy-skeleton absolute size-full rounded-full text-white/70">
      <span class="text-3xl">{page.data.user?.user_metadata.full_name.charAt(0)}</span>
    </div>
    <!-- svelte-ignore a11y_missing_attribute -->
    {#if page.data.user?.user_metadata.avatar_url}
      <img
        src={page.data.user?.user_metadata.avatar_url ?? "favicon.png"}
        class="dy-mask dy-mask-circle absolute size-full"
      />
    {/if}
  </div>
  <h1 class="text-2xl">Moin <strong class="un">{page.data.user?.user_metadata.name}</strong>!</h1>
  <p class="text-lg">Willkommen im Dashboard!</p>
  <p class="text-lg">Hier kannst du deine Veranstaltungen verwalten, Bilder hochladen und vieles mehr.</p>
  <p class="text-lg">Nutze die Navigation, um zu den verschiedenen Bereichen zu gelangen.</p>
  <p class="text-lg">Viel Spaß!</p>
  <p class="mt-2 text-sm">
    Dein letzter Login war am <span class="font-mono"
      >{formatGermanDateTime(page.data.user?.last_sign_in_at ?? new Date().toISOString())}</span
    >.
  </p>
</section>

<section class="dy-prose mx-auto space-y-4 px-4 py-8">
  <h2 class="text-2xl font-bold">Navigation</h2>
  <div class="flex flex-wrap gap-3">
    {#each navItems.slice(1) as item}
      <a
        type="button"
        href={item.href}
        class="dy-btn dy-btn-secondary dy-btn-lg transition-all duration-150 hover:scale-105"
        class:hidden={!page.data.isAdmin && item.requiresAdmin}
        style="flex: 1 1 200px;"
      >
        {item.label}
      </a>
    {/each}
  </div>

  <button class="dy-btn dy-btn-error dy-btn-outline w-full" onclick={() => goto("/dash/logout")}>
    Logout
  </button>
</section>

<style>
  section {
    max-width: var(--container-3xl);
  }
</style>
