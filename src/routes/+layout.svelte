<script lang="ts">
  import "../app.css";
  import { invalidateAll } from "$app/navigation";
  import { onMount } from "svelte";

  let { data, children } = $props();
  let { session, supabase } = $derived(data);

  onMount(() => {
    const { data } = supabase.auth.onAuthStateChange((_, newSession) => {
      if (newSession?.expires_at !== session?.expires_at) {
        invalidateAll();
      }
    });
    return () => data.subscription.unsubscribe();
  });
</script>

{@render children()}
