<script lang="ts">
  import { page } from "$app/state";
  import { buildImageUrl } from "$lib";
  import ArrowUpRight from "$lib/assets/ArrowUpRight.svelte";
  import Download from "$lib/assets/Download.svelte";
  import { onMount } from "svelte";

  let { supabase } = page.data;
  let loading = $state(true);
  let images = $state<Image[]>([]);

  onMount(async () => {
    const { data, error } = await supabase
      .from("images")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching images:", error);
    } else {
      images = data || [];
    }
    loading = false;
  });
</script>

<h1 class="mx-auto my-3 w-fit text-3xl font-bold">Gallerie</h1>

<!-- Gallery Section -->
<section>
  {#if loading}
    <span class="dy-loading dy-loading-dots mx-auto my-5"></span>
  {:else if !loading && images.length === 0}
    <p class="text-gray-500">Hier ist's ziemlich leer...</p>
  {:else if !loading && images.length > 0}
    {#each images as image}
      <div id={image.id} class="image-card">
        <img
          src={buildImageUrl(image.filename, { width: 400, height: 400, fit: "cover" })}
          alt={image.filename}
          loading="lazy"
        />
        <div class="card-actions">
          <p class="truncate p-2 text-sm text-white">{image.filename}</p>
          <a
            class="dy-btn dy-btn-primary dy-btn-dash dy-btn-sm w-28"
            href={buildImageUrl(image.filename)}
            target="_blank"
          >
            Open
            <ArrowUpRight class="size-5" />
          </a>
          <a
            class="dy-btn dy-btn-primary dy-btn-dash dy-btn-sm w-28"
            href={buildImageUrl(image.filename, { download: true })}
            target="_blank"
          >
            Download
            <Download class="size-5" />
          </a>
        </div>
      </div>
    {/each}
  {/if}
</section>

<style>
  section {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-top: 2rem;
    padding: 1rem;
    justify-content: center;
    align-items: center;
  }

  .image-card {
    position: relative;
    flex: 0 1 calc(33.333% - 1rem);
    border-radius: 0.5rem;
    overflow: hidden;
    aspect-ratio: 1 / 1;

    .card-actions {
      position: absolute;
      top: 0;
      right: 0;
      left: 0;
      bottom: 0;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      justify-content: center;
      align-items: center;
      opacity: 0;
      transition: opacity 100ms ease-in-out;
      background-color: rgba(0, 0, 0, 0.5);
      overflow: clip;

      p {
        text-align: center;
        text-wrap: balance;
        width: 100%;
      }

      &:hover {
        opacity: 1;
        background-color: rgba(0, 0, 0, 0.75);
      }
    }
  }
</style>
