import type { Database } from "$lib/supabase";
import { generateConcertId } from "$lib/server/utils.js";

/*
Available query parameters:
 - before?: Date;
 - after?: Date;
 - venue_id?: string;
 - limit?: number;
 - offset?: number;
 - order?: "newestFirst" | "oldestFirst" | "asc" | "desc";
 - sort_col?: "timestamp";
 */
export async function GET({ url, locals: { supabase } }) {
  const searchParams = url.searchParams;

  // Handle query parameters
  // Always have a default value for important parameters
  const limit = searchParams.has("limit") ? parseInt(searchParams.get("limit")!) : 100;
  const offset = searchParams.has("offset") ? parseInt(searchParams.get("offset")!) : 0;
  const order = searchParams.get("order") ?? "desc";
  const sort = searchParams.get("sort_col") ?? "timestamp";

  const before = searchParams.get("before");
  const after = searchParams.get("after");
  const venueId = searchParams.get("venue_id");

  const request = supabase
    .from("concerts")
    .select("*")
    .range(offset, offset + limit - 1)
    .limit(limit)
    .order(sort, { ascending: order === "asc" });

  // Apply filters based on query parameters
  if (before) {
    request.lt("timestamp", new Date(before).toISOString());
  }
  if (after) {
    request.gt("timestamp", new Date(after).toISOString());
  }

  if (venueId) {
    request.eq("venue_id", venueId);
  }

  // Execute the query
  const { data, error } = await request;

  if (error) {
    console.error("Error fetching concerts:", error);
    return new Response("Failed to fetch concerts", { status: 500 });
  }

  return Response.json(data);
}

export async function POST({ request, locals: { supabase } }) {
  const body = await request.json();

  // Construct the thing
  const { name, venue_id, abendkasse, free, notes, price, ticket_url, type, timestamp } = body as Concert;

  const concert: Database["public"]["Tables"]["concerts"]["Insert"] = {
    id: "",
    name,
    venue_id,
    abendkasse,
    free,
    notes,
    price,
    ticket_url,
    type,
    timestamp: new Date(timestamp).toISOString(),
  };

  const id = await generateConcertId(concert.timestamp, supabase);
  concert.id = id;

  const { data, error } = await supabase.from("concerts").insert([concert]).select().single();

  if (error) {
    console.error("Error inserting concert:", error);
    return Response.json({ error }, { status: 500 });
  }

  console.log("Inserted concert:", data);

  return Response.json(data, { status: 201 });
}
