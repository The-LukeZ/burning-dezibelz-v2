<script lang="ts">
  import { page } from "$app/state";
  import { buildImageUrl } from "$lib";
  import { images } from "$lib/stores/images";
  import { onMount } from "svelte";

  let { supabase } = page.data;
  let loading = $state(true);

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
    loading = false;
  });
</script>

<h1 class="mx-auto my-3 w-fit text-3xl font-bold">Gallerie</h1>

<!-- Gallery Section -->
<section>
  {#if loading}
    <span class="dy-loading dy-loading-dots mx-auto my-5"></span>
  {:else if !loading && $images.length === 0}
    <p class="text-gray-500">Hier ist's ziemlich leer...</p>
  {:else if !loading && $images.length > 0}
    {#each $images as image}
      <div class="image-card">
        <img
          src={buildImageUrl(image.filename, { width: 400, height: 300, fit: "contain" })}
          alt={image.filename}
          loading="lazy"
        />
      </div>
    {/each}
  {/if}
</section>

<style>
  section {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-top: 2rem;
    padding: 1rem;
  }

  .image-card {
    flex: 1 1 calc(33.333% - 1rem);
    border-radius: 0.5rem;
    overflow: hidden;
  }
</style>
