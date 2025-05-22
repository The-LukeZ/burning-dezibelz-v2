import type { Database } from "$lib/server/supabase.js";

export async function GET({ params: { concert_id }, locals: { supabase } }) {
  // Fetch a single concert by ID
  const { data, error } = await supabase.from("concerts").select("*").eq("id", concert_id).single();

  if (error) {
    console.error("Error fetching concert:", error);
    return Response.json({ error }, { status: 500 });
  }

  console.log("Fetched concert:", data);

  return Response.json(data, { status: 200 });
}

export async function PUT({ request, locals: { supabase }, params: { concert_id } }) {
  // Update a concert by replacing the entire object (except the id)
  const body = await request.json();
  const cleanedData = Object.keys(body).map((key) =>
    typeof body[key] === "string" ? body[key].trim() : body[key],
  );

  const { name, venue_id, abendkasse, free, notes, price, ticket_url, type, timestamp } =
    cleanedData as Database["public"]["Tables"]["concerts"]["Update"];

  const { data, error } = await supabase
    .from("concerts")
    .update({ venue_id, type, timestamp, name, notes, price, ticket_url, abendkasse, free })
    .eq("id", concert_id)
    .select()
    .single();

  if (error) {
    console.error("Error updating concert:", error);
    return Response.json({ error }, { status: 500 });
  }

  console.log("Updated concert:", data);

  return Response.json(data, { status: 200 });
}
