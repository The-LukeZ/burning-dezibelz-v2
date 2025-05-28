<script lang="ts">
  import { page } from "$app/state";
  import { markdownToHtml } from "$lib";
  import ContentContainer from "$lib/components/ContentContainer.svelte";

  let { data } = $props();
  let aboutUs = $derived(data.about.map((s) => markdownToHtml(s)));
  let bandMembers = $derived(
    data.members.map((m) => ({
      ...m,
      bio: m.bio.map((s) => markdownToHtml(s)),
    })),
  );
</script>

<ContentContainer>
  <section class="dy-prose flex flex-col-reverse items-center justify-center gap-4 lg:flex-row">
    <div class="max-w-2xl text-center">
      <h2>Über uns</h2>
      {#each aboutUs as line}
        <p>{@html line}</p>
      {/each}
      <a href="/setlist" class="dy-link dy-link-primary">Erfahre mehr über unsere Setlist.</a>
    </div>
    <aside class="h-fit max-w-xl overflow-hidden rounded-md shadow-lg">
      <img src="/band_bild_2025-05-28.jpg" alt="Bandfoto" />
    </aside>
  </section>
  <section>
    <h2>Bandmitglieder</h2>
  </section>
</ContentContainer>

<style>
  section {
    width: 100%;
    padding: 2rem;
    &:not(:last-child) {
      margin-bottom: 2rem;
    }

    h2 {
      font-weight: bold;
      font-size: var(--text-2xl);
      margin-bottom: 1rem;
      color: var(--color-primary);
    }

    p:not(:last-child) {
      margin-bottom: 0.7rem;
    }
  }
</style>
