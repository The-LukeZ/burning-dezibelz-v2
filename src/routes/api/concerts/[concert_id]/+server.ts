import type { Database } from "$lib/supabase.js";

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
  const cleanedData = Object.keys(body).reduce((acc, key) => {
    acc[key] = typeof body[key] === "string" ? body[key].trim() : body[key];
    return acc;
  }, {} as any) as Database["public"]["Tables"]["concerts"]["Update"];

  // Validate the cleaned data
  let concertData: Database["public"]["Tables"]["concerts"]["Update"] = {
    notes: cleanedData.notes,
    type: cleanedData.type,
    timestamp: cleanedData.timestamp,
  };

  // Only provide the fields that are allowed to be updated based on type
  if (cleanedData.type === "closed") {
    concertData.type = cleanedData.type;
    concertData.timestamp = cleanedData.timestamp;
    concertData.venue_id = null;
    concertData.ticket_url = null;
    concertData.price = null;
    concertData.name = "";
  } else if (
    cleanedData.type === "public" &&
    typeof cleanedData.venue_id === "string" &&
    cleanedData.venue_id.length > 0
  ) {
    concertData.venue_id = cleanedData.venue_id;
  }

  const { data, error } = await supabase
    .from("concerts")
    .update(concertData)
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

export async function DELETE({ locals: { supabase }, params: { concert_id } }) {
  // Delete a concert by ID
  const { error } = await supabase.from("concerts").delete().eq("id", concert_id);

  if (error) {
    console.error("Error deleting concert:", error);
    return Response.json({ error }, { status: 500 });
  }

  console.log("Deleted concert with ID:", concert_id);

  return new Response(null, { status: 204 });
}
