import { JsonErrors } from "$lib/constants.js";
import { generateConcertId } from "$lib/server/utils.js";
import type { Database } from "$lib/supabase.js";
import { ConcertCreateSchema } from "$lib/utils/assertions.js";
import { ConcertCreateValidator } from "$lib/utils/validator";
import { fromError as FromZodError, ValidationError } from "zod-validation-error";

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
  const order = searchParams.get("order") === "asc" ? "asc" : "desc";
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

  const partialConcert: Partial<Database["public"]["Tables"]["concerts"]["Insert"]> = {
    name: name || null,
    venue_id: venue_id || null,
    abendkasse: abendkasse ?? true,
    free: free ?? false,
    notes: notes || null,
    price: price ?? null,
    ticket_url: ticket_url || null,
    type: type || "public",
    timestamp: new Date(timestamp).toISOString(),
  };

  if (partialConcert.type === "public") {
    if (!partialConcert.venue_id) {
      return JsonErrors.badRequest("Public concerts must have a venue_id");
    }

    const { data: venue, error: venueError } = await supabase
      .from("venues")
      .select("name")
      .eq("id", partialConcert.venue_id!)
      .single();

    if (venueError || !venue) {
      console.error("Error fetching venue:", venueError);
      return JsonErrors.notFound("Venue not found");
    }
  }

  if (!partialConcert.timestamp) {
    return JsonErrors.badRequest("Timestamp is required");
  }

  const id = await generateConcertId(supabase, partialConcert.timestamp);
  partialConcert.id = id;

  // Validate the concert data
  let finalConcert: ReturnType<typeof ConcertCreateValidator.validate>;
  try {
    finalConcert = ConcertCreateValidator.validate(partialConcert);
  } catch (err: any) {
    console.error("Validation error:", err);
    return JsonErrors.badRequest(err?.message);
  }

  const { data, error } = await supabase.from("concerts").insert([finalConcert]).select().single();

  if (error) {
    console.error("Error inserting concert:", error);
    return Response.json({ error }, { status: 500 });
  }

  return Response.json(data, { status: 201 });
}
