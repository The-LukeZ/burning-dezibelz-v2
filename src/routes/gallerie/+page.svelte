<script lang="ts">
  // Package imports
  import { onMount } from "svelte";
  import { slide } from "svelte/transition";
  // $lib imports
  import { page } from "$app/state";
  import { buildImageUrl, loadFolderImages } from "$lib";
  import ArrowUpRight from "$lib/assets/ArrowUpRight.svelte";
  import GalleryFolderList from "$lib/components/GalleryFolderList.svelte";
  import Head from "$lib/components/Head.svelte";
  import Modal from "$lib/components/Modal.svelte";

  // Props, supabase, loading states
  let { data: pageData } = $props();
  let { supabase } = page.data;
  let loading = $state(true);

  // Other $state variables
  let activeFolder = $state<string>("Alle Bilder");
  let innerWidth = $state<number>(640);
  let folderModalOpen = $state(false);
  let imagesByFolder = $state<Record<string, DBImage[]>>({
    "Alle Bilder": [],
  });

  // All $derived variables
  let folders = $derived([
    {
      name: "Alle Bilder",
      count: pageData.imageCount,
    },
    {
      name: "Ohne Ordner",
      count: pageData.otherCount,
    },
    ...pageData.folders.map((folder) => ({
      name: folder.folder_name,
      count: folder.image_count,
    })),
  ]);
  let totalImages = $derived(pageData.imageCount || 0);
  let currentImgs = $derived<DBImage[]>(
    activeFolder in imagesByFolder ? imagesByFolder[activeFolder] || [] : [],
  );

  // Functions
  const IMAGE_LIMIT = 15;

  async function loadImagesForFolder(folder: string, offset: number = 0): Promise<DBImage[]> {
    try {
      return await loadFolderImages(supabase, folder, {
        limit: IMAGE_LIMIT,
        offset,
      });
    } catch (error) {
      console.error(`Error loading images for folder "${folder}":`, error);
      return [];
    }
  }

  async function loadMoreImages(e: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
    e.currentTarget.disabled = true;

    try {
      const currentImages = imagesByFolder[activeFolder] || [];
      const newImages = await loadImagesForFolder(activeFolder, currentImages.length);

      if (newImages.length > 0) {
        const updatedImages = [...currentImages, ...newImages];
        imagesByFolder[activeFolder] = updatedImages;
      } else {
        console.warn("No more images to load.");
      }
    } finally {
      e.currentTarget.disabled = false;
    }
  }

  async function switchFolder(folder: string) {
    if (!imagesByFolder[folder]) {
      imagesByFolder[folder] = await loadImagesForFolder(folder);
    }
    activeFolder = folder;
  }

  // onMount
  onMount(async () => {
    const { data, error } = await supabase
      .from("images")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(IMAGE_LIMIT);

    if (error) {
      console.error("Error fetching images:", error);
    } else {
      imagesByFolder["Alle Bilder"] = data || [];
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

<span class="dy-divider my-1"></span>

<!-- 
TODO:
- Add disabled bindable to the gallery folder list component to disable the folder list when loading images
- Add a loading state to the gallery folder list component
-->

<div class="gallery-grid ml-0 lg:ml-5">
  <GalleryFolderList
    {folders}
    bind:innerWidth
    onFolderClick={async (newFolder) => {
      await switchFolder(newFolder);
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
      {:else if !loading && currentImgs.length === 0}
        <p class="text-gray-500">Hier ist's ziemlich leer...</p>
      {:else if !loading && currentImgs.length > 0}
        {#key activeFolder}
          {#each currentImgs as image}
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
        {/key}
      {/if}
    </section>

    <!-- Load more button -->
    <div class="mx-auto my-5 flex flex-col items-center justify-center gap-2">
      {#key imagesByFolder}
        {@const imageCount =
          activeFolder === "Alle Bilder" ? totalImages : imagesByFolder[activeFolder]?.length || 0}
        {#if !loading && imageCount > currentImgs.length}
          <p class="text-gray-500">{currentImgs.length} von {imageCount} Bildern geladen</p>
          <button class="dy-btn dy-btn-primary dy-btn-soft" onclick={(e) => loadMoreImages(e)}>
            Mehr laden
          </button>
        {:else if !loading && currentImgs.length == imageCount}
          <p class="text-gray-500">Alle Bilder wurden geladen.</p>
        {/if}
      {/key}
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
      onFolderClick={async (newFolder) => {
        await switchFolder(newFolder);
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
