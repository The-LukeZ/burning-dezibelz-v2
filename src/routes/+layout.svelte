<script lang="ts">
  import "../app.css";
  import { afterNavigate, beforeNavigate, goto, invalidateAll } from "$app/navigation";
  import { onMount } from "svelte";
  import { browser } from "$app/environment";
  import { page } from "$app/state";
  import Navbar from "$lib/components/Navbar.svelte";
  import "$lib/stores/events.svelte.js";
  import Footer from "$lib/components/Footer.svelte";
  import { slide } from "svelte/transition";
  import { testSentryConnection } from "$lib/utils/sentryDetect";

  let { data, children } = $props();
  let { supabase, session } = $derived(data);
  let pageLoading = $state(false);
  let showCookieBanner = $state(false);
  let shouldDisableAdblock = $state<boolean>(false);

  beforeNavigate(async () => {
    pageLoading = true;
  });

  afterNavigate(async () => {
    // Reset pageLoading after navigation
    pageLoading = false;
  });

  onMount(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, _session) => {
      /**
       * Instead of invalidating, you could call
       * `session = _session` below and you wouldn't
       * necessarily need to call `invalidate`.
       */
      if (_session?.expires_at !== session?.expires_at) {
        /**
         * We typically only call `signOut()` on the server side,
         * but if `_session` is null - from the user
         * being deleted or the supabase client
         * failing to refresh a token, for example -
         * the SIGNED_OUT event is fired, and
         * calling `goto` ensures the user's screen
         * reflects that they're logged out.
         * Note that the invalidation still happens.
         */
        if (event === "SIGNED_OUT") await goto("/");

        invalidateAll();
      }
    });

    if (browser) {
      showCookieBanner = localStorage.getItem("cookie-banner-accepted") !== "true";
      testSentryConnection().then((isBlocked) => {
        shouldDisableAdblock = isBlocked;
      });
    }

    return () => subscription.unsubscribe();
  });
</script>

<Navbar />

<div class="page-container" class:with-margin={page.url.pathname !== "/"} class:grid={pageLoading}>
  {#if !pageLoading}
    {@render children()}
  {:else}
    <div
      class="relative grid min-h-full w-full place-items-center"
      transition:slide={{ duration: 200, axis: "y" }}
    >
      <span class="dy-loading dy-loading-spinner w-20"></span>
    </div>
  {/if}
</div>

{#if !page.url.pathname.startsWith("/dash")}
  <Footer />
{/if}

{#snippet acceptBannerBtn(btnType: "cookie" | "adblocker")}
  <button
    class="dy-btn dy-btn-primary dy-btn-sm dy-btn-soft"
    onclick={() => {
      if (btnType === "cookie") {
        showCookieBanner = false;
        localStorage.setItem("cookie-banner-accepted", "true");
      } else {
        shouldDisableAdblock = false;
      }
    }}
  >
    OK
  </button>
{/snippet}

{#if showCookieBanner || shouldDisableAdblock}
  <div class="dy-toast dy-toast-bottom dy-toast-center items-center">
    {#if shouldDisableAdblock}
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
        {@render acceptBannerBtn("adblocker")}
      </div>
    {/if}
    {#if showCookieBanner}
      <div class="dy-alert dy-alert-info dy-alert-vertical w-fit" transition:slide={{ duration: 200 }}>
        <div class="flex flex-col gap-1">
          <h3 class="text-base font-semibold">Cookies</h3>
          <p class="text-sm">
            Diese Website verwendet nur notwendige Cookies.<br />
            <a href="/datenschutz" class="dy-link">Datenschutzerklärung</a>
          </p>
        </div>
        {@render acceptBannerBtn("cookie")}
      </div>
    {/if}
  </div>
{/if}

<style>
  .page-container {
    min-height: calc(100vh - var(--navbar-height) - 4rem);
    width: 100%;
    overflow: hidden;
    margin-top: 0;

    &.with-margin {
      margin-top: var(--navbar-height);
    }
  }
</style>
