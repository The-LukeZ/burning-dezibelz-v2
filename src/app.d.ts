import type { Database } from "$lib/server/supabase.js";
import type { Session, SupabaseClient, User } from "@supabase/supabase-js";

// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}

    interface Locals {
      supabase: SupabaseClient<Database>;
      safeGetSession: () => Promise<{ session: Session | null; user: User | null }>;
      session: Session | null;
      user: User | null;
    }

    interface PageData {
      session: Session | null;
      user: User | null;
      currentDate: Date;
    }

    // interface PageState {}

    // interface Platform {}
  }

  type Concert = Database["public"]["Tables"]["concerts"]["Row"];

  type VenueDetails = Database["public"]["Tables"]["venues"]["Row"];
}

export {};
