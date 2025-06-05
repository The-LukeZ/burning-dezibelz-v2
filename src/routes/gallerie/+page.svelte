<script lang="ts">
  import { page } from "$app/state";
  import { buildImageUrl } from "$lib";
  import ArrowUpRight from "$lib/assets/ArrowUpRight.svelte";
  import GalleryFolderList from "$lib/components/GalleryFolderList.svelte";
  import Head from "$lib/components/Head.svelte";
  import Modal from "$lib/components/Modal.svelte";
  import { onMount } from "svelte";
  import { slide } from "svelte/transition";

  let { data: pageData } = $props();
  let { supabase } = page.data;
  let loading = $state(true);

  let images = $state<DBImage[]>([]);
  let folders = $derived([
    {
      name: "Alle Bilder",
      count: pageData.imageCount || 0,
    },
    ...pageData.folders.map((folder) => ({
      name: folder.folder_name,
      count: folder.image_count,
    })),
  ]);
  let activeFolder = $state<string>("Alle Bilder");
  let innerWidth = $state<number>(640);
  let folderModalOpen = $state(false);
  let imageCount = $derived(pageData.imageCount || 0);
  const IMAGE_LIMIT = 15;

  async function loadMoreImages(e: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
    e.currentTarget.disabled = true;

    const query = supabase
      .from("images")
      .select("*")
      .order("created_at", { ascending: false })
      .range(images.length, images.length + IMAGE_LIMIT - 1);

    if (activeFolder !== "Alle Bilder") {
      query.eq("folder_name", activeFolder);
    }

    const { data: _images, error } = await query;

    if (error) {
      console.error("Error fetching more images:", error);
    } else {
      if (_images && _images.length > 0) {
        images.push(..._images);
      } else {
        console.warn("No more images to load.");
      }
    }

    e.currentTarget.disabled = false;
  }

  onMount(async () => {
    const { data, error } = await supabase
      .from("images")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(IMAGE_LIMIT);

    if (error) {
      console.error("Error fetching images:", error);
    } else {
      images = data || [];
    }
    loading = false;
  });
</script>

<Head
  seo_config={{
    title: "Gallerie | Burning Dezibelz",
    description: "Entdecke die Bilder unserer Konzerte und Events.",
    url: "https://burningdezibelz.de/gallerie",
    author_name: "Burning Dezibelz",
    language: "de",
  }}
/>

<h1 class="mx-auto w-fit py-3 text-3xl font-bold">Gallerie</h1>
<p class="mx-auto w-fit p-2 text-center text-sm text-gray-500">
  Hier findest du Bilder von unseren Konzerten und Events.
  <br />
  Du kannst die Bilder nach Ordnern filtern, um bestimmte Veranstaltungen zu finden.
</p>

<div class="gallery-grid">
  <GalleryFolderList
    {folders}
    bind:innerWidth
    bind:activeFolder
    onFolderClick={() => {
      setTimeout(() => {
        folderModalOpen = false;
      }, 200);
    }}
    mobile={false}
  />

  <div class="flex flex-col gap-2">
    <!-- Gallery Section -->
    <section>
      {#if loading}
        <span class="dy-loading dy-loading-dots mx-auto my-5"></span>
      {:else if !loading && images.length === 0}
        <p class="text-gray-500">Hier ist's ziemlich leer...</p>
      {:else if !loading && images.length > 0}
        {#each images as image}
          <div id={image.id} class="image-card dy-skeleton">
            <img
              src={buildImageUrl(image.r2_key, { width: 600, height: 600, fit: "cover", quality: 80 })}
              alt={image.name}
              loading="lazy"
            />
            <div class="card-actions">
              <p class="truncate p-2 text-sm text-white">{image.name}</p>
              <a
                class="dy-btn dy-btn-primary dy-btn-dash dy-btn-sm w-28"
                href={buildImageUrl(image.r2_key)}
                target="_blank"
              >
                Öffnen
                <ArrowUpRight class="size-5" />
              </a>
            </div>
          </div>
        {/each}
      {/if}
    </section>

    <!-- Load more button -->
    <div class="mx-auto my-5 flex flex-col items-center justify-center gap-2">
      {#if !loading && imageCount > images.length}
        <p class="text-gray-500">{images.length} von {imageCount} Bildern geladen</p>
        <button class="dy-btn dy-btn-primary dy-btn-soft" onclick={loadMoreImages}>Mehr laden</button>
      {:else if !loading && images.length == imageCount}
        <p class="text-gray-500">Alle Bilder wurden geladen.</p>
      {/if}
    </div>
  </div>
</div>

<div class="dy-toast dy-toast-right dy-toast-bottom">
  {#if innerWidth < 640}
    <button
      class="dy-btn dy-btn-warning dy-btn-soft"
      onclick={() => (folderModalOpen = true)}
      transition:slide={{ duration: 200, axis: "x" }}
    >
      Ordner anzeigen
    </button>
  {/if}
</div>

<Modal title="Ordner" bind:open={folderModalOpen} closeOnBackdropClick={false}>
  <div class="flex w-full justify-center">
    <GalleryFolderList
      {folders}
      mobile={true}
      bind:activeFolder
      onFolderClick={() => {
        setTimeout(() => {
          folderModalOpen = false;
        }, 200);
      }}
    />
  </div>
</Modal>

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
    flex: 0 1 300px;
    border-radius: 0.5rem;
    overflow: hidden;
    aspect-ratio: 1 / 1;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

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

  .gallery-grid {
    display: grid;
    grid-template-columns: auto 1fr;

    @media screen and (max-width: 640px) {
      grid-template-columns: 1fr;
    }
  }
</style>
