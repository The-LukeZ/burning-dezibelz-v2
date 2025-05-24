<script lang="ts">
  import "../app.css";
  import { goto, invalidateAll } from "$app/navigation";
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import Navbar from "$lib/components/Navbar.svelte";
  import "$lib/stores.svelte.js";
  import { eventStore, fetchConcerts, fetchVenues } from "$lib/stores.svelte.js";
  import LoadData from "$lib/components/LoadData.svelte";

  let { data, children } = $props();
  let { supabase, session } = $derived(data);

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

    return () => subscription.unsubscribe();
  });
</script>

{#if !page.url.pathname.startsWith("/dash")}
  <Navbar />
{/if}

{@render children()}

<LoadData />
