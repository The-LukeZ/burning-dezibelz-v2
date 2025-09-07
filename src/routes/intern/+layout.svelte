<script lang="ts">
  import Head from "$lib/components/Head.svelte";

  let { children } = $props();
</script>

<Head
  seo_config={{
    title: "Dashboard | Burning Dezibelz",
    description: "Interner Bereich der Burning Dezibelz",
    url: "https://burningdezibelz.de/intern",
    author_name: "Burning Dezibelz",
    language: "de",
    twitter_card_type: "summary",
    site_name: "Burning Dezibelz",
    website: "https://burningdezibelz.de/",
  }}
/>

<div class="dash-container">
  {@render children()}
</div>

<style>
  .dash-container {
    padding: 1rem;
    max-width: 1280px;
    margin-inline: auto;
    margin-bottom: 4rem;
  }
</style>
