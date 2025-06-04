import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase";

/**
 * Generates a unique concert ID based on the date and whether it is private or public.
 * @param supabase Supabase client instance
 * @param isoTimestamp ISO timestamp of the concert
 * @returns A unique concert ID in the format: `YYYY-MM-DD-I` (I=index of the concert on that date)
 */
export async function generateConcertId(
  supabase: SupabaseClient<Database>,
  isoTimestamp: string,
): Promise<string> {
  const dateString = isoTimestamp.split("T")[0];

  // Get amount of concerts on that date
  const { data: count, error } = await supabase.rpc("count_concerts_on_date", { p_date: dateString });
  if (error || count === null) {
    console.error("Error counting concerts on date:", error);
    throw new Error("Failed to generate concert ID");
  }

  const index = (count ?? 0) + 1;
  return `${dateString}-${index.toString()}`;
}
