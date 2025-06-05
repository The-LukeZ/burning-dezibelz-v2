<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { buildImageUrl } from "$lib";
  import Trashcan from "$lib/assets/Trashcan.svelte";
  import XIcon from "$lib/assets/XIcon.svelte";
  import { formatGermanDateTime } from "$lib/utils/concerts.js";
  import { onDestroy, onMount } from "svelte";

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
  let images = $state<DBImage[]>([]);
  let selectedImages = $state<DBImage[]>([]);
  let fileInput: HTMLInputElement;

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

      // Step 4: Refresh the images list
      await refreshImages();

      // Reset form
      fileInput.value = "";
      upload.files = undefined;
      upload.uploading = false;
    } catch (err: any) {
      error = err.message;
      console.error("Upload failed:", err);
    } finally {
      siteLoading = false;
    }
  }

  // Helper function to refresh images from Supabase
  async function refreshImages() {
    const { data, error } = await supabase
      .from("images")
      .select("*")
      .eq("status", "completed")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching images:", error);
      return;
    }

    images = data;
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
      images = images.filter((img) => img.id !== imageId);
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
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("Error fetching images:", fetchError);
      error = fetchError.message;
      return;
    }

    images = _images || [];
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

  <section class="mx-auto flex w-full max-w-5xl flex-col items-center justify-center space-y-4">
    <h2 class="text-2xl font-bold">Uploaded files</h2>
    {#if !images.length}
      <p>No files have been uploaded yet.</p>
    {:else}
      <div class="flex w-full flex-wrap justify-center gap-3">
        {#each images as image, index}
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
      </div>
    {/if}
  </section>
</div>

{#if selectedImages.length > 0}
  <div class="dy-toast dy-toast-end">
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
  </div>
{/if}

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
</style>
