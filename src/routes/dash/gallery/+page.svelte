<script lang="ts">
  import { enhance } from "$app/forms";
  import { page } from "$app/state";
  import { addExtension, buildImageUrl, getFileExtension, removeExtension } from "$lib";
  import Modal from "$lib/components/Modal.svelte";
  import { formatGermanDateTime } from "$lib/utils/concerts";
  import { create_upload } from "$lib/utils/upload";
  import { onDestroy, onMount } from "svelte";
  import { cubicOut } from "svelte/easing";
  import { Tween } from "svelte/motion";

  const upload = create_upload();

  let { supabase } = page.data;
  let loading = $state(false);
  let files = $state<FileList>();
  let images = $state<Image[]>([]);
  let selectedImages = $state<Image[]>([]);
  const progress = new Tween(0, {
    duration: 400,
    easing: cubicOut,
  });
  const selectedImage = $state({
    modalOpen: false,
    image: null as Image | null,
    update: null as Image | null,
  });
  let imagesListener: any;
  let fileInput: HTMLInputElement;

  $effect(() => {
    progress.set($upload.progress / 100);
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

  function toggleImageSelection(e: MouseEvent & { currentTarget: EventTarget & HTMLInputElement }) {
    e.stopPropagation();
    const imageId = e.currentTarget.id;
    if (!imageId) return;
    if (e.currentTarget.checked) {
      selectedImages.push(images.find((img) => img.id === imageId)!);
    } else {
      selectedImages = $state.snapshot(selectedImages).filter((img) => img.id !== imageId);
    }
  }

  function addImage(newImg: Image) {
    console.log("Adding new image:", newImg);
    images.push(newImg);
  }

  function updateImage(newImg: Image) {
    console.log("Updating image:", newImg);
    images = $state.snapshot(images).map((img) => (img.id === newImg.id ? newImg : img));
  }

  function deleteImage(imageId: string) {
    console.log("Deleting image with ID:", imageId);
    images = $state.snapshot(images).filter((img) => img.id !== imageId);
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

    if (!files || files.length === 0) {
      console.error("No files selected for upload.");
      loading = false;
      return;
    }

    const file = files[0];
    await upload.start({ url: "/api/images/upload", file, filename: file.name });
    fileInput.value = "";
    progress.set(0);
    loading = false;
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

    imagesListener = supabase
      .channel("public:images")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "images",
        },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            updateImage(payload.new as Image);
          } else if (payload.eventType === "DELETE") {
            deleteImage(payload.old.id);
          } else if (payload.eventType === "INSERT") {
            addImage(payload.new as Image);
          }
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("Subscribed to images channel.");
        }
      });
  });

  onDestroy(async () => {
    if (imagesListener) {
      await supabase.removeChannel(imagesListener);
      console.log("Unsubscribed from images channel.");
    }
    resetSelectedImage();
    files = undefined;
    progress.set(0);
    loading = false;
  });
</script>

<div class="flex w-full flex-col items-center justify-center space-y-4">
  <h1 class="text-center text-3xl font-bold">Upload and manage images</h1>

  <div class="flex w-full flex-col items-center">
    <form class="mx-auto flex w-full max-w-sm flex-col" onsubmit={handleFileSubmit}>
      <fieldset class="dy-fieldset w-full text-center">
        <legend class="dy-fieldset-legend">Pick an image</legend>
        <input bind:this={fileInput} bind:files type="file" class="dy-file-input w-full" accept="image/*" />
      </fieldset>
      <div class="dy-join dy-join-vertical">
        <progress class="dy-join-item dy-progress" value={progress.current}></progress>
        <button class="dy-join-item dy-btn dy-btn-primary" disabled={loading || !files || files.length === 0}>
          {#if loading}
            Uploading... {$upload.progress}%
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
          <button
            class="dy-card image-grid-item bg-base-200 max-w-md text-start drop-shadow-md drop-shadow-black/40"
            onclick={() => selectImage(image.id)}
          >
            <figure class="relative aspect-video">
              <img
                src={buildImageUrl(image.filename, { width: 400, height: 300, fit: "contain" })}
                alt={image.filename}
                loading="lazy"
              />
              <!-- 
              TODO: Figure out, why bulk deletion does not work on the server side
              <input
                id={image.id}
                type="checkbox"
                class="dy-checkbox dy-checkbox-lg dy-checkbox-info absolute top-2 right-2"
                onclick={toggleImageSelection}
              /> -->
            </figure>
            <div class="dy-card-body overflow-hidden">
              <div class="w-full"><h3 class="dy-card-title w-full truncate">{image.filename}</h3></div>
              <p class="dy-card-text">Uploaded at: {formatGermanDateTime(image.created_at)}</p>
            </div>
          </button>
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
      class="flex flex-col items-center justify-center gap-4"
      use:enhance={() => {
        loading = true;
        return async ({ result, update }) => {
          await update({ invalidateAll: false });
          if (result.type === "success") {
            resetSelectedImage();
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
          const res = await fetch("/api/images/delete", {
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
