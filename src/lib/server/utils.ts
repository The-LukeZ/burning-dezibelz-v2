import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase";

export async function generateConcertId(
  isoTimestamp: string,
  supabase: SupabaseClient<Database>,
): Promise<string> {
  // Schema: YYYY-MM-DD-I (I=Index)
  const dateString = isoTimestamp.split("T")[0];

  // Get amount of concerts on that date
  const { data: count, error } = await supabase.rpc("count_concerts_on_date", { concert_date: dateString });
  if (error || count === null) {
    console.log("Count of concerts on date:", count);
    console.error("Error counting concerts on date:", error);
    throw new Error("Failed to generate concert ID");
  }

  console.log("Count of concerts on date:", count);

  const index = (count ?? 0) + 1;
  return dateString + "-" + index;
}
