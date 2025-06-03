<script>
  import Head from "$lib/components/Head.svelte";
</script>

<svelte:head>
  <meta name="robots" content="index, nofollow" />
</svelte:head>

<Head
  seo_config={{
    title: "Impressum | Burning Dezibelz",
    description: "Impressum der Burning Dezibelz",
    url: "https://burningdezibelz.de/impressum",
    author_name: "Burning Dezibelz",
    language: "de",
  }}
/>

<div class="dy-prose mx-auto w-full max-w-[1000px] items-center justify-between p-[1rem] py-5">
  <h1 class="text-3xl font-bold">Impressum</h1>
  <span class="dy-divider"></span>
  <h2 class="text-xl">Angaben gemäß § 5 TMG</h2>
  <article class="w-full">
    <ul class="list-none">
      <li class="mt-0 mb-0">Jan Mehlhorn</li>
      <li class="mt-0 mb-0">Poststraße 10</li>
      <li class="mt-0 mb-0">09353 Oberlungwitz</li>
      <li class="mt-0 mb-0">Deutschland</li>
    </ul>
    <p>
      Email: <a href="mailto:burningdezibelz@gmail.com" target="_blank" class="dy-link-primary">
        burningdezibelz@gmail.com
      </a>
    </p>
  </article>
  <span class="dy-divider"></span>
  <article>
    <h3>Verantwortlich für den Inhalt der Seiten:</h3>
    <ul class="list-none">
      <li class="mt-0 mb-0">Luca Hentschel</li>
      <li class="mt-0 mb-0">Schneeberger Straße 31</li>
      <li class="mt-0 mb-0">08112 Wilkau-Haßlau</li>
      <li class="mt-0 mb-0">Deutschland</li>
    </ul>
  </article>
</div>

<style>
  article {
    color: var(--color-gray-300);
    > *:not(:first-child) {
      margin-top: 0.4rem;
    }
    > *:not(:last-child) {
      margin-bottom: 0.4rem;
    }
  }

  h1,
  h2,
  h3 {
    color: var(--color-base-content);
    font-weight: var(--font-weight-semibold);
    margin-bottom: 0.5rem;
  }

  h1 {
    font-size: var(--text-2xl);
    font-weight: var(--font-weight-bold);
  }

  h2 {
    font-size: var(--text-xl);
  }

  h3 {
    font-size: var(--text-lg);
  }

  ul {
    padding-left: 1.5rem;
  }
</style>
