<script lang="ts">
  import { enhance } from "$app/forms";
  import { page } from "$app/state";
  import { addExtension, buildImageUrl, getFileExtension, removeExtension } from "$lib";
  import Trashcan from "$lib/assets/Trashcan.svelte";
  import XIcon from "$lib/assets/XIcon.svelte";
  import Modal from "$lib/components/Modal.svelte";
  import { formatGermanDateTime } from "$lib/utils/concerts";
  import { onDestroy, onMount } from "svelte";

  let { supabase } = page.data;
  let loading = $state(false);
  let error = $state<string | null>(null);
  let files = $state<FileList>();
  let images = $state<Image[]>([]);
  let selectedImages = $state<Image[]>([]);
  const selectedImage = $state({
    modalOpen: false,
    image: null as Image | null,
    update: null as Image | null,
  });
  let fileInput: HTMLInputElement;

  $effect(() => {
    console.log("Files changed:", $state.snapshot(files));
  });

  function selectImage(imageId: string | null) {
    selectedImage.image = images.find((img) => img.id === imageId) || null;
    if (!selectedImage.image) {
      console.error("Image not found:", imageId);
      return;
    }
    selectedImage.modalOpen = !!imageId;
    selectedImage.update = structuredClone($state.snapshot(selectedImage.image));
  }

  function resetSelectedImage() {
    selectedImage.image = null;
    selectedImage.update = null;
    selectedImage.modalOpen = false;
    loading = false;
  }

  async function handleFileSubmit(event: SubmitEvent & { currentTarget: EventTarget & HTMLFormElement }) {
    event.preventDefault();
    loading = true;
    error = null;

    const file = files?.[0];

    if (file) {
      const res = await fetch("/api/cdn/presigned", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
        }),
      });

      if (!res.ok) {
        console.error("Failed to get presigned URL");
        return;
      }

      const { presignedUrl, ...rest } = await res.json();
      console.log("Presigned URL received:", presignedUrl);
      console.log("Additional data:", rest);
      const uploadRes = await fetch(presignedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!uploadRes.ok) {
        console.error("Failed to upload file");
        return;
      }

      const { key } = await uploadRes.json();
      console.log("File uploaded successfully:", key);
    }
  }

  onMount(async () => {
    if (images.length > 0) return;

    const { data, error } = await supabase
      .from("images")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching images:", error);
      return;
    }

    images = data;
  });

  onDestroy(async () => {
    resetSelectedImage();
    files = undefined;
    loading = false;
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
            bind:files
            type="file"
            class="dy-file-input dy-file-input-accent grow"
            accept="image/*"
          />
          <button
            class="dy-btn dy-btn-ghost dy-btn-circle dy-btn-sm hover:text-base-content"
            class:hidden={!files?.length}
            onclick={() => {
              fileInput.value = "";
              files = undefined;
            }}
          >
            <XIcon />
          </button>
        </label>
      </fieldset>
      <div class="dy-join dy-join-vertical">
        <progress class="dy-join-item dy-progress dy-progress-secondary"></progress>
        <button class="dy-join-item dy-btn dy-btn-accent" disabled={!files?.length || loading} type="submit">
          {#if loading}
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
        {#each images as image}
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
          <div
            tabindex="0"
            class="dy-card image-grid-item bg-base-200 max-w-md text-start drop-shadow-md drop-shadow-black/40 focus:ring-2"
            onclick={() => selectImage(image.id)}
            onkeydown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                selectImage(image.id);
              }
            }}
          >
            <figure class="relative aspect-video">
              <img
                src={buildImageUrl(image.filename, { width: 400, height: 300, fit: "contain" })}
                alt={image.filename}
                loading="lazy"
              />
              <!-- TODO: Make this a checkbox and find out why bulk deletion doesn't work properly (unlink issues) -->
              <button
                class="dy-btn dy-btn-warning dy-btn-soft dy-btn-circle absolute top-2 right-2 z-10 shadow-md"
                onclick={async (e) => {
                  e.stopPropagation();
                  // Imitate a form submission
                  if (confirm("Are you sure you want to delete this image?")) {
                    await fetch(`?/delete`, {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                      },
                      body: new URLSearchParams({ imageId: image.id }),
                    });
                    resetSelectedImage();
                  }
                }}
              >
                <Trashcan />
              </button>
            </figure>
            <div class="dy-card-body overflow-hidden">
              <div class="w-full"><h3 class="dy-card-title w-full truncate">{image.filename}</h3></div>
              <p class="dy-card-text">Uploaded at: {formatGermanDateTime(image.created_at)}</p>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </section>
</div>

<Modal
  bind:open={selectedImage.modalOpen}
  onClose={() => {
    selectedImage.image = null;
  }}
  class="max-h-screen w-full max-w-2xl overflow-y-auto"
>
  {#if selectedImage.image && selectedImage.update}
    <form
      method="POST"
      action="?/update"
      class="flex flex-col items-center justify-center gap-2"
      use:enhance={() => {
        loading = true;
        return async ({ action, result, update }) => {
          await update({ invalidateAll: false });
          if (result.type === "success") {
            if (action.toString().endsWith("update")) {
              console.log("Image updated successfully:", result.data);
            } else if (action.toString().endsWith("delete")) {
              console.log("Image deleted successfully:", result.data);
              resetSelectedImage();
            }
          }
        };
      }}
    >
      <h2 class="text-2xl font-bold">Image Details</h2>
      <fieldset class="dy-fieldset">
        <legend class="dy-fieldset-legend">Image name</legend>
        <input
          required
          name="filename"
          type="text"
          class="dy-input dy-validator w-full max-w-md"
          minlength="3"
          maxlength="256"
          pattern="[A-Za-z0-9_\.\-]+"
          title="Letters, numbers, underscores, dots, and dashes only"
          placeholder="Filename"
          oninput={(e) => {
            const input = e.currentTarget.value;
            selectedImage.update!.filename = addExtension(
              input,
              getFileExtension(selectedImage.image!.filename)!,
            );
            console.log("Updated filename:", $state.snapshot(selectedImage.update!.filename));
          }}
          {@attach (element) => {
            const justFilename = removeExtension(structuredClone(selectedImage.image!.filename));
            element.value = justFilename;
            console.log("Setting initial filename:", justFilename);
          }}
        />
        <p class="dy-validator-hint">Must be valid filename [A-Za-z0-9_.-]</p>
      </fieldset>
      <span class="dy-divider my-1 w-full"></span>
      <div class="mx-auto w-full max-w-lg place-items-center">
        <!-- svelte-ignore a11y_missing_attribute -->
        <img
          src={buildImageUrl(selectedImage.image.filename)}
          alt={selectedImage.image.description || selectedImage.image.filename}
          loading="lazy"
          class="h-full max-h-96"
        />
      </div>
      <span class="dy-divider my-1 w-full"></span>
      <fieldset class="dy-fieldset">
        <legend class="dy-fieldset-legend">Description</legend>
        <textarea
          name="description"
          class="dy-textarea max-h-40 w-full max-w-md"
          placeholder="Description"
          bind:value={selectedImage.update.description}
        ></textarea>
      </fieldset>
      <label class="dy-label">
        <input
          type="checkbox"
          name="is_private"
          bind:checked={selectedImage.update.is_private}
          class="dy-checkbox"
        />
        <span class="dy-label-text">Private image (only visible to you)</span>
      </label>
      <input type="hidden" name="imageId" value={selectedImage.update.id} />
      <div class="flex w-full flex-row-reverse justify-center gap-2">
        <button type="submit" formaction="?/update" class="dy-btn dy-btn-primary" disabled={loading}>
          Update Image
        </button>
        <button type="submit" formaction="?/delete" class="dy-btn dy-btn-error" disabled={loading}>
          Delete Image
        </button>
      </div>
    </form>
  {/if}
</Modal>

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
