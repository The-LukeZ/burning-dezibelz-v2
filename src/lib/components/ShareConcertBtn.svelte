<script lang="ts">
  import { eventStore } from "$lib/stores/events.svelte";
  import type { Database } from "$lib/supabase";
  import { concertHref } from "$lib/utils/concerts";

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
  }

  let { concertData, small = true, btnType = "info" }: Props = $props();
</script>

<button
  class="dy-btn dy-btn-outline"
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
    const link = `${window.location.origin}${concertHref(concertId, venueName)}`;
    navigator.clipboard.writeText(link);
    alert("Concert link copied to clipboard!\n" + link);
  }}
>
  Share
</button>
