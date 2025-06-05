<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import {
    buildImageUrl,
    mimeTypeToExtension,
    normalizeFolderName,
    normalizeName,
    removeExtension,
  } from "$lib";
  import ChevronLeft from "$lib/assets/ChevronLeft.svelte";
  import ExpandArrows from "$lib/assets/ExpandArrows.svelte";
  import Trashcan from "$lib/assets/Trashcan.svelte";
  import XIcon from "$lib/assets/XIcon.svelte";
  import { formatGermanDateTime } from "$lib/utils/concerts.js";
  import { onMount } from "svelte";
  import { fade, scale } from "svelte/transition";

  let { supabase } = page.data;
  let imageId = page.params.imageid;
  let siteLoading = $state(false);
  let error = $state<string | null>(null);
  let success = $state<string | null>(null);
  let image = $state<DBImage | null>(null);
  /**
   * The data used to update the image.
   *
   * ### `name` doesn't include the file extension!
   */
  const updateData = $state<Pick<DBImage, "name" | "folder" | "mime_type">>({
    name: "",
    folder: "",
    mime_type: "image/webp",
  });
  let copySuccess = $state(false);
  let imageOnFullDisplay = $state(false);

  async function loadImage() {
    const { data, error: fetchError } = await supabase
      .from("images")
      .select("*")
      .eq("id", imageId)
      .eq("status", "completed")
      .single();

    if (fetchError) {
      console.error("Error fetching image:", fetchError);
      error = "Image not found";
      return;
    }

    image = data;
    updateData.name = removeExtension(data.name);
    updateData.folder = data.folder || null;
    updateData.mime_type = data.mime_type || "image/webp";
  }

  async function updateImage() {
    if (!image || updateData.name.length < 3 || updateData.name.length > 256) {
      error = "Image name must be between 3 and 256 characters.";
      return;
    }

    try {
      siteLoading = true;
      error = null;

      const fullName =
        `${normalizeName(updateData.name)}${mimeTypeToExtension(updateData.mime_type, true)}` as const;

      const fullFolder = updateData.folder ? normalizeFolderName(updateData.folder) : null;

      const response = await fetch("/api/cdn/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId: image.id, newName: fullName, newFolder: fullFolder }),
      });

      if (!response.ok) {
        throw new Error("Failed to update image");
      }

      image.name = updateData.name;
    } catch (err: any) {
      error = err.message;
      console.error("Update failed:", err);
    } finally {
      siteLoading = false;
    }
  }

  async function deleteImage() {
    if (!image || !confirm("Are you sure you want to delete this image?")) return;

    try {
      siteLoading = true;

      const response = await fetch("/api/cdn/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageIds: [image.id] }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete image");
      }

      goto("/dash/gallery");
    } catch (err: any) {
      error = err.message;
      console.error("Delete failed:", err);
    } finally {
      siteLoading = false;
    }
  }

  async function shareImage() {
    if (copySuccess || !image) return;
    try {
      await navigator.clipboard.writeText(
        decodeURIComponent(page.url.origin + `/cdn/${encodeURIComponent(image.r2_key)}`),
      );
      copySuccess = true;
      setTimeout(() => {
        copySuccess = false;
      }, 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  }

  onMount(loadImage);
</script>

<div class="mx-auto flex w-full max-w-4xl flex-col items-center justify-center space-y-6 p-4">
  <div class="grid w-full grid-cols-1 place-items-center gap-4 sm:grid-cols-3 sm:place-items-stretch">
    <button class="dy-btn dy-btn-outline w-fit" onclick={() => goto("/dash/gallery")}>
      <ChevronLeft />
      Back to Gallery
    </button>
    <h1 class="text-center text-2xl font-bold sm:text-3xl">Image Details</h1>
    <div class="flex justify-end">
      <button
        class="dy-btn dy-btn-outline dy-btn-info dy-btn-sm"
        onclick={shareImage}
        class:dy-btn-success={copySuccess}
      >
        {#if copySuccess}
          ✓ Copied!
        {:else}
          📋 Share
        {/if}
      </button>
    </div>
  </div>

  {#if error}
    <div class="dy-alert dy-alert-error w-full max-w-md">
      <span>{error}</span>
    </div>
  {/if}

  {#if image}
    <div class="flex w-full flex-col items-center gap-6 lg:flex-row">
      <!-- Image Preview -->
      <div class="flex w-full flex-col items-center lg:w-1/2">
        <div class="bg-base-200 dy-skeleton relative w-full max-w-lg overflow-hidden rounded-lg shadow-lg">
          <img src={buildImageUrl(image.r2_key)} alt={image.name} class="h-full w-full object-contain" />
          <div class="absolute inset-0 top-0 right-0 bottom-0 left-0 grid place-items-center">
            <button
              class="dy-btn dy-btn-ghost dy-btn-warning dy-btn-square dy-btn-xl"
              onclick={() => (imageOnFullDisplay = true)}
            >
              <ExpandArrows class="size-full" />
            </button>
          </div>
        </div>
        <p class="text-base-content/70 mt-2 text-sm">
          Uploaded: {formatGermanDateTime(image.created_at)}
        </p>
      </div>

      <!-- Management Panel -->
      <div class="flex w-full flex-col space-y-4 lg:w-1/2">
        <div class="dy-card bg-base-200 shadow-lg">
          <div class="dy-card-body">
            <h2 class="dy-card-title">Edit Image</h2>
            <form
              onsubmit={(e) => {
                e.preventDefault();
                updateImage();
              }}
            >
              <fieldset class="dy-fieldset">
                <legend class="dy-fieldset-legend">Image name</legend>
                <input
                  required
                  type="text"
                  class="dy-input dy-validator w-full"
                  minlength="3"
                  maxlength="256"
                  pattern="[A-Za-z0-9_\.\-]+"
                  title="Letters, numbers, underscores, dots, and dashes only"
                  placeholder="Filename"
                  bind:value={updateData.name}
                />
                <p class="dy-validator-hint">
                  Must be valid filename [A-Za-z0-9_.-] and between 3 and 256 characters
                </p>
              </fieldset>

              <fieldset class="dy-fieldset">
                <legend class="dy-fieldset-legend">Folder</legend>
                <input
                  type="text"
                  class="dy-input dy-validator w-full"
                  bind:value={updateData.folder}
                  placeholder="Folder"
                  pattern="[A-Za-z0-9_\- ]+"
                  title="Alphanumeric characters, underscores, and dashes only"
                  minlength="1"
                  maxlength="64"
                />
                <span>The name of the folder in which the image is grouped.</span>
                <p class="dy-validator-hint">Only alphanumeric characters, underscores, and dashes</p>
              </fieldset>

              <div class="flex justify-end space-x-2">
                <button
                  type="submit"
                  class="dy-btn dy-btn-primary"
                  disabled={siteLoading || updateData.name === image.name}
                >
                  {#if siteLoading}
                    Updating...
                  {:else}
                    Update Image
                  {/if}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div class="dy-card bg-error/10 shadow-lg">
          <div class="dy-card-body">
            <h3 class="dy-card-title text-error">Danger Zone</h3>
            <p class="text-base-content/70 text-sm">
              Once you delete an image, there is no going back.<br />Please be certain.
            </p>
            <div class="dy-card-actions justify-end">
              <button class="dy-btn dy-btn-error" disabled={siteLoading} onclick={deleteImage}>
                <Trashcan />
                Delete Image
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  {:else if !error}
    <div class="flex items-center justify-center">
      <span class="dy-loading dy-loading-spinner dy-loading-lg"></span>
    </div>
  {/if}
</div>

<!-- Big ass popup which shows the image on full display when image is clicked -->
{#if image && imageOnFullDisplay}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70" transition:fade>
    <div class="big-image-container" transition:scale>
      <img src={buildImageUrl(image.r2_key)} alt={image.name} class="rounded-lg shadow-lg" />
      <button
        class="dy-btn dy-btn-ghost dy-btn-warning dy-btn-square absolute top-2 right-2"
        onclick={() => (imageOnFullDisplay = false)}
      >
        <XIcon />
      </button>
    </div>
  </div>
{/if}

<style>
  .big-image-container {
    position: relative;
    max-width: calc(100dvw * 0.95);

    img {
      max-width: 100%;
      height: auto;
    }
  }
</style>
