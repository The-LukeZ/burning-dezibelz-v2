<script lang="ts">
  import { eventStore } from "$lib/stores/events.svelte";
  import type { Database } from "$lib/supabase";
  import { concertHref } from "$lib/utils/concerts";
  import type { ClassValue } from "svelte/elements";

  interface Props {
    concertData:
      | ({
          id: string;
          type: Database["public"]["Enums"]["ConcertType"];
          venue_id?: string | null;
        } & Record<string, any>)
      | null;
    /**
     * If true, the button will be smaller.
     *
     * @default true
     */
    small?: boolean;
    /**
     * The type of button to display.
     * This will determine the button's colors.
     */
    btnType?: "warning" | "success" | "info";
    btnText?: string;
    additionalClasses?: ClassValue;
  }

  let {
    concertData,
    small = true,
    btnType = "info",
    additionalClasses = "",
    btnText = "Share",
  }: Props = $props();
</script>

<button
  class="dy-btn {additionalClasses}"
  class:dy-btn-sm={small}
  class:dy-btn-info={btnType === "info"}
  class:dy-btn-warning={btnType === "warning"}
  class:dy-btn-success={btnType === "success"}
  onclick={() => {
    if (!concertData) return;
    const concertId = concertData.id;
    let venueName: string | null = null;
    if (concertData.type === "public" && concertData.venue_id) {
      const venue = eventStore.venues.get(concertData.venue_id);
      if (venue) {
        venueName = venue.name;
      }
    }
    navigator.clipboard.writeText(`${window.location.origin}${concertHref(concertId, venueName)}`);
    alert("Konzert Link kopiert!");
  }}
>
  {btnText}
</button>
