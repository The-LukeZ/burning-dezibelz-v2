<script lang="ts">
  import { page } from "$app/state";
  import { buildImageUrl } from "$lib";
  import { concertHref } from "$lib/utils/concerts.js";
  import JsonLd from "../JsonLd.svelte";

  type Props = {
    event: Concert;
    venue?: VenueDetails;
    image?: DBImage;
  };

  let { event, venue, image }: Props = $props();

  let schema_org = $derived<SchemaOrgSchema>({
    "@context": "https://schema.org",
    "@type": "MusicEvent",
    name: event.name ?? `Konzert am ${new Date(event.timestamp).toLocaleDateString("de-DE")}`,
    startDate: event.timestamp,
    image: image ? page.url.origin + buildImageUrl(image.r2_key, { format: "webp" }) : undefined,
    url: page.url.origin + concertHref(event.id, venue?.name ?? null),
    
  });
</script>

<JsonLd item={schema_org} />
