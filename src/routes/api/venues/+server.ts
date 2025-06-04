import type { Database } from "$lib/supabase.js";

export async function GET({ locals: { supabase } }) {
  const { data, error } = await supabase.from("venues").select("*").order("id", { ascending: false });

  if (error) {
    console.error("Error fetching venues:", error);
    return Response.json({ error }, { status: 500 });
  }

  return Response.json(data, { status: 200 });
}

export async function POST({ request, locals: { supabase } }) {
  const body = await request.json();

  // Construct the thing
  const { name, address, city, state, postal_code, country, url } = body as VenueDetails;
  const venue: Database["public"]["Tables"]["venues"]["Insert"] = {
    name,
    address,
    city,
    state,
    postal_code,
    country,
    url,
  };

  const { data, error } = await supabase.from("venues").insert([venue]).select().single();

  if (error) {
    console.error("Error inserting venue:", error);
    return Response.json({ error }, { status: 500 });
  }

  return Response.json(data, { status: 201 });
}
