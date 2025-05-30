<script lang="ts">
  import { Tween } from "svelte/motion";
  import { cubicOut } from "svelte/easing";
  import { slide } from "svelte/transition";
  import { enhance } from "$app/forms";
  import { create_upload } from "$lib/utils/upload";
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import { images } from "$lib/stores/images";
  import { invalidateAll } from "$app/navigation";

  const upload = create_upload();

  let { supabase } = page.data;
  let loading = $state(false);

  const progress = new Tween(0, {
    duration: 400,
    easing: cubicOut,
  });
  let files = $state<FileList>();

  $effect(() => {
    progress.set($upload.progress / 100);
  });

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

<h1>Upload and view files with SvelteKit and Node.js</h1>

<div class="flex w-full flex-col items-center">
  <form class="mx-auto w-full max-w-md" onsubmit={handleFileSubmit}>
    <fieldset class="dy-fieldset w-full">
      <legend class="dy-fieldset-legend">Pick a large file</legend>
      <input bind:files type="file" class="dy-file-input" accept="image/*" />
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

<section aria-label="Uploaded files">
  <h2>Uploaded files</h2>
  {#if !$images.length}
    <p>No files have been uploaded yet.</p>
  {:else}
    <ol class="files">
      {#each $images as image}
        <li class="" transition:slide={{ duration: 200 }}>
          <span class="">{(image.file_size / 1000).toFixed(1)} kB</span>
          <a class="" href="/images/{image.filename}" target="_blank" rel="noreferrer">
            {image.filename}
          </a>
          <form
            class="dy-label"
            method="POST"
            action="?/delete"
            enctype="multipart/form-data"
            use:enhance={({ submitter }) => {
              submitter?.setAttribute("disabled", "true");

              return async ({ update }) => {
                await update();
                submitter?.removeAttribute("disabled");
              };
            }}
          >
            <button name="dy-btn dy-btn-error" value={image.filename}>Delete</button>
          </form>
        </li>
      {/each}
    </ol>
  {/if}
</section>
