<script lang="ts">
  import Head from "$lib/components/Head.svelte";
  import type { SeoConfig } from "$lib/components/Head.svelte";
  import JsonLd from "$lib/components/JsonLd.svelte";

  let { data } = $props();

  const seo_config: SeoConfig = {
    title: "Setlist | Burning Dezibelz",
    description:
      "Entdecke die Burning Dezibelz, eine junge Rock- und Metal-Band aus Zwickau. Konzerte, Musik, Gallerie und mehr!",
    url: "https://burningdezibelz.de/setlist",
    author_name: "Burning Dezibelz",
    language: "de",
    open_graph_image: "https://burningdezibelz.de/band_bild_2025-05-28.jpg",
    open_graph_image_alt: "Burning Dezibelz Banner",
    site_name: "Burning Dezibelz",
    twitter_card_type: "summary_large_image",
    website: "https://burningdezibelz.de",
  };

  const schema_org: SchemaOrgSchema = {
    "@context": "https://schema.org",
    "@type": "MusicPlaylist",
    name: "Burning Dezibelz Setlist",
    description: "Die Setlist der Band Burning Dezibelz.",
    url: "https://burningdezibelz.de/setlist",
    track:
      data.songs?.map((song) => ({
        "@type": "MusicRecording",
        name: song.title,
        byArtist: {
          "@type": "MusicGroup",
          name: song.artist,
        },
        citation: song.is_own ? "Eigener Song" : "Kein eigener Song",
      })) || [],
  };
</script>

<Head {seo_config} />
<JsonLd item={schema_org} />

<div class="mx-auto mb-10 max-w-[800px] overflow-x-auto">
  <table class="dy-table dy-table-zebra min-w-[400px]">
    <thead class="bg-primary/20 text-neutral-content">
      <tr>
        <th class="w-1/2">Titel</th>
        <th class="w-1/2">Interpret</th>
        <th aria-details="Eigener Song Indikator"></th>
      </tr>
    </thead>
    <tbody>
      {#if data.error || !data.songs || data.songs.length === 0}
        <tr>
          <td colspan="3" class="bg-info text-info-content rounded-b text-center">Keine Songs gefunden.</td>
        </tr>
      {:else}
        {#each data.songs as song}
          <tr class="transition duration-75 hover:bg-(--color-light-base-100)">
            <td>{song.title}</td>
            <td>{song.artist}</td>
            <td class="size-4">
              {#if song.is_own}
                <div class="dy-tooltip dy-tooltip-left flex h-full items-center">
                  <div class="dy-tooltip-content">
                    <span>Eigner Song!</span>
                  </div>
                  <div class="bg-primary size-4 rounded-full"></div>
                </div>
              {/if}
            </td>
          </tr>
        {/each}
      {/if}
    </tbody>
  </table>
</div>

<style>
  thead tr {
    border-bottom: 1px solid var(--color-primary);
    font-size: var(--text-lg);
  }
</style>
