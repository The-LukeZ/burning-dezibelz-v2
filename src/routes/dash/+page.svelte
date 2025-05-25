<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";

  let files = $state<FileList>();
  let uploadedResults = $state<string[]>([]);

  $effect(() => {
    if (files) {
      const fileList = $state.snapshot(files);
      console.log(fileList);

      for (const file of fileList) {
        console.log(`${file.name}: ${file.size} bytes`);
      }
    }
  });
</script>

<h1 class="mx-auto mb-4 w-fit">Moin {page.data.user?.user_metadata.name}</h1>

<section class="flex flex-col items-center justify-center gap-4">
  <!-- Fileupload test -->
  <input bind:files type="file" accept="image/*" class="dy-file-input" />
  <button class="dy-btn dy-btn-accent" onclick={() => console.log(files)}>Log Files</button>
  <button
    class="dy-btn dy-btn-primary"
    onclick={async () => {
      // Perform post request to upload files
      if (files && files.length > 0) {
        const formData = new FormData();
        formData.append("file", files[0]); // Only one file for simplicity

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          console.log("Upload successful:", result);
          uploadedResults.push(result.url);
        } else {
          console.error("Upload failed:", response.statusText);
        }
      }
    }}
  >
    Upload
  </button>

  {#if uploadedResults.length > 0}
    {#each uploadedResults as result, i}
      <img src={result} alt="Uploaded Image, {i}" class="size-fit object-cover" />
    {/each}
  {/if}
</section>
