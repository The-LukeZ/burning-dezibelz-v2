<script lang="ts">
  import "../app.css";
  import { goto, invalidateAll } from "$app/navigation";
  import { onMount } from "svelte";

  let { data, children } = $props();
  /**
   * We use the $derived rune so that
   * `supabase` and `session` are updated
   * during invalidation. $state doesn't do this.
   *
   * An updated supabase client isn't typically needed,
   * but the ssr libary returns a cached client
   * for us during invalidation. Otherwise we'd be
   * initializing a client during every invalidation.
   */
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

{@render children()}
