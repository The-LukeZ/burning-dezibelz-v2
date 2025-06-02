export async function load({ params, locals: { supabase } }) {
  const { data: fullData, error: imageError } = await supabase.rpc("get_full_concert", {
    p_concert_id: params.concert_id,
  });

  if (imageError || !fullData) {
    console.error(imageError);
    const notFound = imageError?.message?.includes("not found") || !fullData;
    return { error: imageError?.message || "Concert not found", status: notFound ? 404 : 500 };
  }

  const concert: Concert = {
    id: fullData.concert_id,
    name: fullData.concert_name,
    timestamp: fullData.concert_timestamp,
    image: fullData.image_id ?? null,
    venue_id: fullData.venue_id,
    type: fullData.concert_type as ConcertType,
    notes: fullData.concert_notes ?? null,
    price: fullData.concert_price ?? null,
    free: fullData.concert_free,
    abendkasse: fullData.concert_abendkasse,
    ticket_url: fullData.concert_ticket_url ?? null,
  };

  const venue: VenueDetails | null = fullData.venue_id
    ? {
        id: fullData.venue_id,
        name: fullData.venue_name,
        address: fullData.venue_address ?? null,
        city: fullData.venue_city ?? null,
        postal_code: fullData.venue_postal_code ?? null,
        country: fullData.venue_country ?? null,
        state: fullData.venue_state ?? null,
        url: fullData.venue_url ?? null,
      }
    : null;

  const image: PartialDBImage | null = fullData.image_id
    ? {
        id: fullData.image_id,
        name: fullData.image_name,
        r2_key: fullData.image_r2_key,
      }
    : null;

  return {
    concert,
    venue,
    image,
    error: null,
    status: 200,
  };
}
