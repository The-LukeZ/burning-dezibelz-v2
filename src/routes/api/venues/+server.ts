export async function GET({ url, locals: { supabase } }) {
  const searchParams = url.searchParams;
  const { data, error } = await supabase.from("venues").select("*").order("id", { ascending: false });

  if (error) {
    console.error("Error fetching venues:", error);
    return Response.json({ error }, { status: 500 });
  }

  return Response.json(data, { status: 200 });
}

// See: DBLocation
export async function POST({ request, locals: { supabase } }) {
  const venue: VenueDetails = await request.json();
  const { data, error } = await supabase.from("venues").insert([venue]).select().single();

  if (error) {
    console.error("Error inserting venue:", error);
    return Response.json({ error }, { status: 500 });
  }

  console.log("Inserted venue:", data);

  return Response.json(data, { status: 201 });
}
