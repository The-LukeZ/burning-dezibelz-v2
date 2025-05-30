<script lang="ts">
  import { enhance } from "$app/forms";
  import { invalidateAll } from "$app/navigation";
  import { page } from "$app/state";
  import { buildImageUrl } from "$lib";
  import ArrowUpRight from "$lib/assets/ArrowUpRight.svelte";
  import Modal from "$lib/components/Modal.svelte";
  import { images } from "$lib/stores/images";
  import { formatGermanDateTime } from "$lib/utils/concerts";
  import { create_upload } from "$lib/utils/upload";
  import { onMount } from "svelte";
  import { cubicOut } from "svelte/easing";
  import { Tween } from "svelte/motion";

  const upload = create_upload();

  let { supabase } = page.data;
  let loading = $state(false);
  let files = $state<FileList>();
  const progress = new Tween(0, {
    duration: 400,
    easing: cubicOut,
  });
  const selectedImage = $state({
    modalOpen: false,
    image: null as Image | null,
    update: null as Image | null,
  });

  $effect(() => {
    progress.set($upload.progress / 100);
  });

  function selectImage(imageId: string | null) {
    selectedImage.image = $images.find((img) => img.id === imageId) || null;
    if (!selectedImage.image) {
      console.error("Image not found:", imageId);
      return;
    }
    selectedImage.modalOpen = !!imageId;
    selectedImage.update = structuredClone($state.snapshot(selectedImage.image));
  }

  function updateImage(newImg: Image) {
    const newImgs = $images.map((img) => (img.id === newImg.id ? newImg : img));
    images.update(() => newImgs);
    selectedImage.image = null;
    selectedImage.update = null;
    selectedImage.modalOpen = false;
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
    const headers = { "x-file-name": file.name };

    await upload.start({ url: "/api/upload", file, headers });
    await invalidateAll();
    progress.set(0);
    event.currentTarget.reset();

    loading = false;
  }

  onMount(async () => {
    if ($images.length > 0) return;

    const { data, error } = await supabase
      .from("images")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Error fetching images:", error);
      return;
    }
    images.set(data);
  });
</script>

<div class="flex w-full flex-col items-center justify-center space-y-4">
  <h1 class="text-center text-3xl font-bold">Upload and manage images</h1>

  <div class="flex w-full flex-col items-center">
    <form class="mx-auto flex w-full max-w-md flex-col" onsubmit={handleFileSubmit}>
      <fieldset class="dy-fieldset w-full text-center">
        <legend class="dy-fieldset-legend">Pick a large file</legend>
        <input bind:files type="file" class="dy-file-input mx-auto" accept="image/*" />
      </fieldset>
      <progress class="dy-progress" value={progress.current}></progress>
      <button class="dy-btn dy-btn-primary" disabled={loading}>
        {#if loading}
          Uploading... {$upload.progress}%
        {:else}
          Upload
        {/if}
      </button>
    </form>
  </div>

  <section class="mx-auto flex w-full max-w-5xl flex-col items-center justify-center space-y-4">
    <h2 class="text-2xl font-bold">Uploaded files</h2>
    {#if !$images.length}
      <p>No files have been uploaded yet.</p>
    {:else}
      <div class="flex w-full flex-wrap justify-center gap-3">
        {#each $images as image}
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <button
            class="dy-card image-grid-item bg-base-200 text-start drop-shadow-md drop-shadow-black/40"
            onclick={() => selectImage(image.id)}
          >
            <figure>
              <img
                src={buildImageUrl(image.filename, { width: 400, height: 300, fit: "fill" })}
                alt={image.filename}
                class="aspect-video"
                loading="lazy"
              />
            </figure>
            <div class="dy-card-body">
              <h3 class="dy-card-title">{image.filename}</h3>
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
  class="w-full max-w-2xl"
>
  {#if selectedImage.image && selectedImage.update}
    <form
      method="POST"
      action="?/update"
      class="flex flex-col items-center justify-center gap-4"
      use:enhance={() => {
        loading = true;
        return async ({ action, result, update }) => {
          await update({ invalidateAll: false });
          if (result.type === "success") {
            if (action.toString().endsWith("update")) {
              console.log("Image updated successfully:", result.data);
            }
            loading = false;
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
          bind:value={selectedImage.update.filename}
        />
        <p class="dy-validator-hint">Must be valid filename [A-Za-z0-9_.-]</p>
      </fieldset>
      <div class="shadow-accent relative mx-auto w-full max-w-md shadow-md">
        <!-- svelte-ignore a11y_missing_attribute -->
        <img
          src={buildImageUrl(selectedImage.image.filename)}
          alt={selectedImage.image.description || selectedImage.image.filename}
          class="w-full"
          loading="lazy"
        />
        <a
          href={buildImageUrl(selectedImage.image.filename)}
          target="_blank"
          class="absolute top-2 right-2 flex cursor-pointer items-center justify-center rounded-full bg-black/50 p-2 text-white transition hover:bg-black/70"
          title="View full size"
        >
          <ArrowUpRight />
        </a>
      </div>
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
      <div class="flex w-full flex-row-reverse justify-center">
        <button type="submit" formaction="?/update" class="dy-btn dy-btn-primary">Update Image</button>
        <button type="submit" formaction="?/delete" class="dy-btn dy-btn-error">Delete Image</button>
      </div>
    </form>
  {/if}
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

      &:hover {
        transform: scale(105%);
      }
    }
  }

  fieldset {
    width: 100%;
    place-items: center;
    text-align: center;
  }
</style>
