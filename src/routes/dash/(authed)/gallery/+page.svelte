<script lang="ts">
  import { goto, invalidateAll } from "$app/navigation";
  import { page } from "$app/state";
  import { buildImageUrl, loadFolderImages } from "$lib";
  import Trashcan from "$lib/assets/Trashcan.svelte";
  import XIcon from "$lib/assets/XIcon.svelte";
  import GalleryFolderList from "$lib/components/GalleryFolderList.svelte";
  import Modal from "$lib/components/Modal.svelte";
  import { formatGermanDateTime } from "$lib/utils/concerts.js";
  import { onDestroy, onMount } from "svelte";
  import { slide } from "svelte/transition";

  // Props
  let { data: pageData } = $props();

  let { supabase } = page.data;
  let siteLoading = $state(false);
  let error = $state<string | null>(null);
  const upload = $state<{
    uploading: boolean;
    files: FileList | undefined;
  }>({
    uploading: false,
    files: undefined,
  });
  let selectedImages = $state<DBImage[]>([]);
  let fileInput: HTMLInputElement;

  // Folder-related state variables
  let activeFolder = $state<string>("Alle Bilder");
  let innerWidth = $state<number>(640);
  let folderModalOpen = $state(false);
  let imagesByFolder = $state<Record<string, DBImage[]>>({
    "Alle Bilder": [],
  });

  // Derived variables for folders
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
  let currentImgs = $derived<DBImage[]>(
    activeFolder in imagesByFolder ? imagesByFolder[activeFolder] || [] : [],
  );
  let totalImages = $derived(pageData.imageCount || 0);

  // Constants
  const IMAGE_LIMIT = 20;

  $effect(() => {
    console.log("Files changed:", $state.snapshot(upload.files));
  });

  function viewImage(imageId: string) {
    goto(`/dash/gallery/${imageId}`);
  }

  async function handleFileSubmit(event: SubmitEvent & { currentTarget: EventTarget & HTMLFormElement }) {
    event.preventDefault();
    siteLoading = true;
    error = null;
    upload.uploading = true;

    const file = upload.files?.[0];
    if (!file) return;

    try {
      // Step 1: Get presigned URL and create DB record
      const uploadRes = await fetch("/api/cdn/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type,
        }),
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to initialize upload");
      }

      const { presignedUrl, imageId } = await uploadRes.json();

      // Step 2: Upload to R2
      const r2Response = await fetch(presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!r2Response.ok) {
        throw new Error("Failed to upload to R2");
      }

      // Step 3: Confirm upload success in database
      await fetch("/api/cdn/upload/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageId,
          fileSize: file.size,
        }),
      });

      // Reset form
      fileInput.value = "";
      upload.files = undefined;
      upload.uploading = false;

      await invalidateAll();
    } catch (err: any) {
      error = err.message;
      console.error("Upload failed:", err);
    } finally {
      siteLoading = false;
    }
  }

  // New folder-related functions
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

  async function switchFolder(folder: string) {
    if (!imagesByFolder[folder]) {
      imagesByFolder[folder] = await loadImagesForFolder(folder);
    }
    activeFolder = folder;
  }

  async function loadMoreImages() {
    siteLoading = true;
    try {
      const currentImages = imagesByFolder[activeFolder] || [];
      const newImages = await loadImagesForFolder(activeFolder, currentImages.length);

      if (newImages.length > 0) {
        const updatedImages = currentImages.concat(...newImages);
        imagesByFolder[activeFolder] = updatedImages;
        currentImgs = updatedImages;
      }
    } catch (err: any) {
      error = err.message;
      console.error("Load more images failed:", err);
    } finally {
      siteLoading = false;
    }
  }

  async function deleteImage(imageId: string) {
    if (!confirm("Are you sure you want to delete this image?")) return;

    try {
      siteLoading = true;

      // This should also delete from R2 in the backend
      const response = await fetch("/api/cdn/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageIds: [imageId] }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete image");
      }

      // Remove from local state
      currentImgs = currentImgs.filter((img) => img.id !== imageId);
    } catch (err: any) {
      error = err.message;
      console.error("Delete failed:", err);
    } finally {
      siteLoading = false;
    }
  }

  onMount(async () => {
    const { data: _images, error: fetchError } = await supabase
      .from("images")
      .select("*")
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(IMAGE_LIMIT);

    if (fetchError) {
      console.error("Error fetching images:", fetchError);
      error = fetchError.message;
      return;
    }

    imagesByFolder["Alle Bilder"] = _images || [];
  });

  onDestroy(async () => {
    upload.files = undefined;
    siteLoading = false;
  });
</script>

<div class="flex w-full flex-col items-center justify-center space-y-4">
  <h1 class="text-center text-3xl font-bold">Upload and manage images</h1>

  <div class="flex w-full flex-col items-center">
    <form class="mx-auto flex w-full max-w-sm flex-col" onsubmit={handleFileSubmit}>
      <fieldset class="dy-fieldset w-full text-center">
        <legend class="dy-fieldset-legend">Pick an image</legend>
        <label class="dy-label w-full">
          <input
            bind:this={fileInput}
            bind:files={upload.files}
            type="file"
            class="dy-file-input dy-file-input-accent grow"
            accept="image/*"
          />
          <button
            class="dy-btn dy-btn-ghost dy-btn-circle dy-btn-sm hover:text-base-content"
            class:hidden={!upload.files?.length}
            onclick={() => {
              fileInput.value = "";
              upload.files = undefined;
            }}
          >
            <XIcon />
          </button>
        </label>
      </fieldset>
      <div class="dy-join dy-join-vertical">
        <progress
          class="dy-join-item dy-progress dy-progress-secondary"
          value={upload.uploading ? undefined : 0}
        ></progress>
        <button
          class="dy-join-item dy-btn dy-btn-accent"
          disabled={!upload.files?.length || upload.uploading}
          type="submit"
        >
          {#if upload.uploading}
            Uploading...
          {:else}
            Upload
          {/if}
        </button>
      </div>
    </form>
  </div>
</div>

<!-- Folder selection -->
<div class="gallery-grid">
  <GalleryFolderList
    {folders}
    bind:innerWidth
    mobile={false}
    onFolderClick={async (newFolder) => {
      await switchFolder(newFolder);
      setTimeout(() => {
        folderModalOpen = false;
      }, 200);
    }}
  />

  <section class="mx-auto flex w-full max-w-5xl flex-col items-center justify-center space-y-4">
    <div class="flex items-center gap-4">
      <h2 class="text-2xl font-bold">
        {activeFolder === "Alle Bilder" ? "All uploaded files" : `Files in ${activeFolder}`}
      </h2>
      <span class="dy-badge dy-badge-secondary">
        {`${currentImgs.length} / ${totalImages} files`}
      </span>
    </div>

    {#if !currentImgs.length}
      <p>No files in this folder yet.</p>
    {:else}
      <div class="flex w-full flex-wrap justify-center gap-3">
        {#key activeFolder}
          {#each currentImgs as image}
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
            <div
              tabindex="0"
              class="dy-card image-grid-item bg-base-200 max-w-md text-start drop-shadow-md drop-shadow-black/40 focus:ring-2"
              onclick={() => viewImage(image.id)}
              onkeydown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  viewImage(image.id);
                }
              }}
            >
              <figure class="relative aspect-video">
                <img
                  src={buildImageUrl(image.r2_key, { width: 400, height: 300, fit: "contain", quality: 50 })}
                  alt={image.name}
                  loading="lazy"
                />
                <!-- TODO: Implement bulk deletion -->
                <button
                  class="dy-btn dy-btn-warning dy-btn-soft dy-btn-circle absolute top-2 right-2 z-10 shadow-md"
                  onclick={async (e) => {
                    e.stopPropagation();
                    await deleteImage(image.id);
                  }}
                >
                  <Trashcan />
                </button>
              </figure>
              <div class="dy-card-body overflow-hidden">
                <div class="w-full"><h3 class="dy-card-title w-full truncate">{image.name}</h3></div>
                <p class="dy-card-text">Uploaded at: {formatGermanDateTime(image.created_at)}</p>
              </div>
            </div>
          {/each}
        {/key}
      </div>

      <!-- Load more button -->
      {#key imagesByFolder}
        {@const imageCount =
          activeFolder === "Alle Bilder" ? totalImages : imagesByFolder[activeFolder]?.length || 0}
        {#if imageCount > currentImgs.length}
          <button class="dy-btn dy-btn-primary dy-btn-soft" onclick={loadMoreImages} disabled={siteLoading}>
            {siteLoading ? "Loading..." : "Load more images"}
          </button>
        {/if}
      {/key}
    {/if}
  </section>
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

  {#if selectedImages.length > 0}
    <div class="dy-alert dy-alert-error">
      <button
        class="dy-btn dy-btn-soft dy-btn-sm"
        onclick={async (e) => {
          e.currentTarget.disabled = true;
          const res = await fetch("/api/cdn/delete", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ imageIds: selectedImages.map((img) => img.id) }),
          });

          if (res.ok) {
            console.log("Images deleted successfully");
            selectedImages = [];
          } else {
            console.error("Failed to delete images:", res.statusText);
          }
          e.currentTarget.disabled = false;
        }}
      >
        <span>Delete {selectedImages.length} images</span>
      </button>
    </div>
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
  .image-grid-item {
    flex: 0 1 400px;

    @media screen and (max-width: 600px) {
      flex: 0 1 100%;
    }

    img {
      width: 100%;
      height: auto;
      object-fit: cover;
      transition: transform 150ms ease-in-out;
    }

    figure:hover img {
      transform: scale(105%);
    }
  }

  fieldset {
    width: 100%;
    place-items: center;
    text-align: center;
  }

  .gallery-grid {
    display: grid;
    grid-template-columns: auto 1fr;
    margin-top: 1.5rem;

    @media screen and (max-width: 640px) {
      grid-template-columns: 1fr;
    }
  }
</style>
