export async function GET({ params: { venue_id }, locals: { supabase } }) {
  const { data, error } = await supabase.from("venues").select("*").eq("id", venue_id).single();

  if (error) {
    console.error("Error fetching venue:", error);
    return Response.json({ error }, { status: 500 });
  }

  return Response.json(data);
}
