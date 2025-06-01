<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { buildImageUrl } from "$lib";
  import ChevronLeft from "$lib/assets/ChevronLeft.svelte";
  import Trashcan from "$lib/assets/Trashcan.svelte";
  import { formatGermanDateTime } from "$lib/utils/concerts";
  import { onMount } from "svelte";

  let { supabase } = page.data;
  let imageId = page.params.imageid;
  let siteLoading = $state(false);
  let error = $state<string | null>(null);
  let image = $state<DBImage | null>(null);
  let updateData = $state<{ name: string }>({ name: "" });
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
    updateData.name = data.name;
  }

  async function updateImage() {
    if (!image || updateData.name.length < 3 || updateData.name.length > 256) {
      error = "Image name must be between 3 and 256 characters.";
      return;
    }

    try {
      siteLoading = true;
      error = null;

      const response = await fetch("/api/cdn/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId: image.id, newName: updateData.name }),
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
        <div class="bg-base-200 dy-skeleton w-full max-w-lg overflow-hidden rounded-lg shadow-lg">
          <img
            src={buildImageUrl(image.r2_key, { quality: 40 })}
            alt={image.name}
            class="h-full w-full object-contain"
          />
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
              class="space-y-4"
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
                <span
                  >Note, that you <strong class="font-black">can</strong> remove the file extension, but it is
                  recommended to keep it for clarity.</span
                >
                <p class="dy-validator-hint">
                  Must be valid filename [A-Za-z0-9_.-] and between 3 and 256 characters
                </p>
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
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
    <div class="relative max-w-3xl">
      <img src={buildImageUrl(image.r2_key, { quality: 80 })} alt={image.name} class="rounded-lg shadow-lg" />
      <button class="absolute top-2 right-2 text-white" onclick={() => (image = null)}> ✖ </button>
    </div>
  </div>
{/if}
