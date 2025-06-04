<script lang="ts">
  import { slide } from "svelte/transition";
  import { testSentryConnection } from "$lib/utils/sentryDetect";
  import { onDestroy, onMount } from "svelte";

  let showBannerOverride = $state<boolean | null>(null);

  onMount(async () => {
    const isBlocked = await testSentryConnection();
    showBannerOverride = isBlocked;
    if (isBlocked) {
      console.warn("Adblocker detected, showing banner override");
    } else {
      console.log("No adblocker detected, banner override not shown");
    }
  });

  onDestroy(() => {
    showBannerOverride = null;
  });
</script>

{#if showBannerOverride}
  <div class="dy-alert dy-alert-warning dy-alert-vertical" transition:slide={{ duration: 200 }}>
    <p class="text-center">
      Du nutzt einen Adblocker. Wir bitten dich höflich, ihn zu deaktivieren, da wir <strong
        >keine Werbung</strong
      >
      nutzen.
      <br />
      Jedoch nutzen wir ein Tool, um <strong>Fehler</strong> zu protokollieren, welches leider von vielen
      Adblockern blockiert wird. Dies ist wichtig für die <strong>Wartung der Seite</strong> und das
      <strong>Beheben von Fehlern</strong>.
      <br />
      <strong>Vielen Dank für dein Verständnis!</strong>
    </p>
    <button
      class="dy-btn dy-btn-primary dy-btn-sm dy-btn-soft"
      onclick={() => {
        showBannerOverride = false;
        console.log("Adblocker warning dismissed");
      }}
    >
      OK
    </button>
  </div>
{/if}
