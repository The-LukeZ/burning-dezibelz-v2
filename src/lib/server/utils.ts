import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase";

/**
 * Generates a unique concert ID based on the date and whether it is private or public.
 * @param supabase Supabase client instance
 * @param data Object containing the ISO timestamp and whether the concert is private or public.
 *             If private, venueName is optional; if public, venueName is required.
 * @returns A unique concert ID in the format: `YYYY-MM-DD-I-[private|public]-[venueName]`
 */
export async function generateConcertId(
  supabase: SupabaseClient<Database>,
  data: { isoTimestamp: string; isPrivate?: boolean; venueName?: string },
): Promise<string> {
  const prefix = data.isPrivate ? "private" : "public";
  let prefix2: string = "";
  if (!data.isPrivate && data.venueName) {
    prefix2 = data.venueName.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
  } else if (!data.isPrivate && !data.venueName) {
    throw new Error("Venue name is required for public concerts");
  }

  // Schema: YYYY-MM-DD-I (I=Index)
  const dateString = data.isoTimestamp.split("T")[0];

  // Get amount of concerts on that date
  const { data: count, error } = await supabase.rpc("count_concerts_on_date", { date_param: dateString });
  if (error || count === null) {
    console.log("Count of concerts on date:", count);
    console.error("Error counting concerts on date:", error);
    throw new Error("Failed to generate concert ID");
  }

  const index = (count ?? 0) + 1;
  return `${dateString}-${index.toString().padStart(3, "0")}-${prefix}${prefix2 ? `-${prefix2}` : ""}`;
}
