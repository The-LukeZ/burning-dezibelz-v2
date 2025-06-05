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
  let generalError = $state<string | null>(null);
  const upload = $state<{
    uploading: boolean;
    files: FileList | undefined;
    folder: {
      value: string;
      isValid: boolean | null;
    };
    error: string | null;
  }>({
    uploading: false,
    files: undefined,
    folder: {
      value: "",
      isValid: null,
    },
    error: null,
  });
  let selectedImages = $state<DBImage[]>([]);
  let fileInput: HTMLInputElement;

  // Folder-related state variables
  let activeFolder = $state<string>("Alle Bilder");
  let innerWidth = $state<number>(640);
  let modalsOpen = $state({
    folderList: false,
    uploadImage: false,
  });
  let imagesByFolder = $state<Record<string, DBImage[]>>({
    "Alle Bilder": [],
  });

  // Derived variables for folders
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
  let currentImgs = $derived<DBImage[]>(
    activeFolder in imagesByFolder ? imagesByFolder[activeFolder] || [] : [],
  );
  let totalImages = $derived(pageData.imageCount || 0);
  let filteredFolders = $state<string[]>(
    pageData.folders.filter((f) => f.folder_name !== "Alle Bilder").map((f) => f.folder_name),
  );

  // Constants
  const IMAGE_LIMIT = 20;

  function viewImage(imageId: string) {
    goto(`/dash/gallery/${imageId}`);
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
      generalError = err.message;
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
      generalError = err.message;
      console.error("Delete failed:", err);
    } finally {
      siteLoading = false;
    }
  }

  async function handleFileSubmit(event: SubmitEvent & { currentTarget: EventTarget & HTMLFormElement }) {
    event.preventDefault();
    siteLoading = true;
    generalError = null;
    upload.error = null;
    upload.uploading = true;

    const file = upload.files?.[0];
    if (!file) {
      upload.error = "Please select a file to upload.";
      upload.uploading = false;
      siteLoading = false;
      return;
    }

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
      upload.folder.value = "";

      await invalidateAll();
    } catch (err: any) {
      generalError = err.message;
      console.error("Upload failed:", err);
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
      generalError = fetchError.message;
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

  <div class="flex w-full flex-col items-end">
    <button class="dy-btn dy-btn-primary dy-btn-soft" onclick={() => (modalsOpen.uploadImage = true)}>
      Upload Image
    </button>
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
        modalsOpen.folderList = false;
      }, 200);
    }}
  />

  <section class="mx-auto flex w-full max-w-5xl flex-col items-center justify-center space-y-4">
    <div class="xs:flex-row xs:gap-4 flex flex-col items-center gap-2">
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
      onclick={() => (modalsOpen.folderList = true)}
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

<Modal title="Ordner" bind:open={modalsOpen.folderList} closeOnBackdropClick={false}>
  <div class="flex w-full justify-center">
    <GalleryFolderList
      {folders}
      mobile={true}
      onFolderClick={async (newFolder) => {
        await switchFolder(newFolder);
        setTimeout(() => {
          modalsOpen.folderList = false;
        }, 200);
      }}
    />
  </div>
</Modal>

<Modal
  title="Upload Image"
  bind:open={modalsOpen.uploadImage}
  class="space-y-2"
  onClose={() => {
    upload.files = undefined;
    upload.folder.value = "";
    upload.folder.isValid = null;
    upload.uploading = false;
    upload.error = null;
  }}
>
  <form class="mx-auto flex w-full max-w-sm flex-col gap-2" onsubmit={handleFileSubmit}>
    <fieldset class="dy-fieldset border-base-300 rounded-box bg-base-200 w-full border p-4 text-center">
      <legend class="dy-fieldset-legend">Pick an image</legend>
      <label class="dy-label w-full items-center">
        <input
          bind:this={fileInput}
          bind:files={upload.files}
          type="file"
          accept="image/*"
          class="dy-file-input dy-file-input-accent grow"
        />
        <button
          class="dy-btn dy-btn-soft dy-btn-circle dy-btn-sm dy-btn-warning"
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
    <fieldset class="dy-fieldset border-base-300 rounded-box bg-base-200 w-full border p-4 text-center">
      <legend class="dy-fieldset-legend">Select Folder</legend>
      <div class="flex w-full flex-col justify-center gap-1">
        <label class="dy-label">
          <input
            type="text"
            bind:value={upload.folder.value}
            placeholder="Select a folder or type a new one"
            class="dy-input dy-input-accent w-full"
            class:dy-input-error={!upload.folder.isValid === true && upload.folder.value.length > 0}
            class:dy-input-success={upload.folder.isValid === true}
            minlength="3"
            maxlength="64"
            list="folder-list"
            oninput={(e) => {
              const value = e.currentTarget.value.trim();
              upload.folder.value = value;
              if (!value) {
                upload.folder.isValid = null;
              } else {
                upload.folder.isValid =
                  /^[A-Za-z0-9_\-.öäüß ]+$/.test(value) && value.length >= 3 && value.length <= 64;
              }
            }}
          />
          <datalist id="folder-list">
            {#each filteredFolders as folder}
              <option value={folder}></option>
            {/each}
          </datalist>
          <button
            type="button"
            class="dy-btn dy-btn-soft dy-btn-circle dy-btn-sm dy-btn-warning"
            class:hidden={!upload.folder.value}
            onclick={() => {
              upload.folder.value = "";
              upload.folder.isValid = null;
            }}
          >
            <XIcon />
          </button>
        </label>
        <p class="text-error" class:hidden={upload.folder.isValid === true || upload.folder.isValid === null}>
          Only alphanumeric characters, underscores, spaces and dashes!
        </p>
      </div>
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
  {#if upload.error}
    <div class="dy-alert dy-alert-error justify-center">
      <span>{upload.error}</span>
    </div>
  {/if}
</Modal>

<div class="dy-toast dy-toast-center z-[1000]">
  {#if generalError}
    <div class="dy-alert dy-alert-error">
      <span class="dy-alert-text">{generalError}</span>
    </div>
  {/if}
</div>

<style>
  section {
    padding: 1rem;
  }

  .image-grid-item {
    flex: 0 1 350px;

    @media screen and (max-width: 640px) {
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
    transition-delay: 500ms;
    transition: grid-template-columns 200ms ease-in-out;

    @media screen and (max-width: 640px) {
      grid-template-columns: 1fr;
    }
  }
</style>
