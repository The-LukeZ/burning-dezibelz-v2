<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import Head from "$lib/components/Head.svelte";
  import { onMount } from "svelte";

  let deleted = $state<boolean>(false);

  onMount(() => {
    const url = new URL(page.url);
    if (url.searchParams.has("deleted")) {
      deleted = url.searchParams.get("deleted") === "true";
      url.searchParams.delete("deleted");
      goto(url, { replaceState: true });
    }
  });
</script>

<Head
  seo_config={{
    title: "Datenschutz | Burning Dezibelz",
    description: "Datenschutzbestimmungen der Burning Dezibelz",
    url: "https://burningdezibelz.de/datenschutz",
    author_name: "Burning Dezibelz",
    language: "de",
  }}
/>

<div class="dy-prose mx-auto w-full max-w-[1000px] items-center justify-between p-[1rem] py-5">
  <h1 class="text-3xl font-bold">Datenschutz</h1>
  <span class="dy-divider"></span>
  <article class="prose">
    <section>
      <h2>Datenerhebung und -verarbeitung</h2>
      <p>
        Diese Website bietet eine Anmeldefunktion über Google-Konten an. Diese Funktion ist ausschließlich für
        interne Zwecke bestimmt und nicht für die öffentliche Nutzung vorgesehen.
      </p>
    </section>

    <section>
      <h3>Welche Daten werden erhoben?</h3>
      <p>
        Bei der Anmeldung über Google werden folgende Daten von Ihrem Google-Konto abgerufen und gespeichert:
      </p>
      <ul class="list-inside list-disc">
        <li>E-Mail-Adresse</li>
        <li>Name</li>
        <li>Profilbild (falls vorhanden)</li>
      </ul>
    </section>

    <section>
      <h3>Verwendung von Cookies</h3>
      <p>
        Diese Website verwendet Cookies ausschließlich für folgende Zwecke:
      </p>
      <ul class="list-inside list-disc">
        <li>Authentifizierung und Aufrechterhaltung der Anmeldesitzung</li>
        <li>Technische Abwicklung der Datenlöschung</li>
      </ul>
      <p>
        Es werden keine Tracking- oder Marketing-Cookies verwendet. Die Cookies sind für die Funktionalität
        der Anmeldung technisch erforderlich und werden nach dem Abmelden oder automatisch nach Ablauf
        der Sitzung gelöscht.
      </p>
    </section>

    <section>
      <h3>Zweck der Datenverarbeitung</h3>
      <p>
        Die erhobenen Daten dienen ausschließlich der Authentifizierung und dem internen Zugang zu geschützten
        Bereichen der Website.
      </p>
      <p>
        Wenn Sie sich über Google anmelden und jedoch nicht autorisiert sind, auf geschützte Bereiche
        zuzugreifen, werden dennoch Accountdaten wie oben genannt gespeichert. Diese Daten werden
        ausschließlich für interne Zwecke verwendet und nicht an Dritte weitergegeben.
      </p>
    </section>

    <section>
      <h3>Datenlöschung</h3>
      <p>
        Wenn Sie sich über Google angemeldet haben und nicht autorisiert sind, auf geschützte Bereiche
        zuzugreifen, können Sie unten den Button, klicken. Dann müssen sie sich erneut anmelden, damit ihr
        Account für die Löschung identifiziert werden kann.
      </p>
      <div class="my-2">
        {#if !deleted}
          <form method="POST" action="?/delete-data">
            <button class="dy-btn dy-btn-accent dy-btn-soft" type="submit"> Daten löschen </button>
          </form>
        {:else}
          <div class="dy-alert dy-alert-success w-md justify-center px-8">
            <div>
              <strong>Erfolg:</strong> Ihre Daten wurden erfolgreich gelöscht.
            </div>
          </div>
        {/if}
      </div>
    </section>
  </article>
</div>

<style>
  article {
    color: var(--color-gray-300);
    > *:not(:first-child) {
      margin-top: 1rem;
    }
    > *:not(:last-child) {
      margin-bottom: 1rem;
    }
  }

  h1,
  h2,
  h3 {
    color: var(--color-base-content);
    font-weight: var(--font-weight-semibold);
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
