export async function load({ params, locals: { supabase } }) {
  const { data: venue, error } = await supabase.from("venues").select("*").eq("id", params.venue_id).single();

  if (error || !venue) {
    console.error("Error fetching venue:", error);
    return { error: `Venue with ID ${params.venue_id} not found.` };
  }

  return { venue };
}
