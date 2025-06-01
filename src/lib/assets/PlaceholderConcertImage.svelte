<script lang="ts">
  import type { ClassValue } from "svelte/elements";

  type Props = {
    class?: ClassValue;
  };

  let { class: className = "" }: Props = $props();
</script>

<img src="/placeholder-concert.webp" alt="Platzhalter Konzertbild; Generiert mit Gemini" class={className} />
