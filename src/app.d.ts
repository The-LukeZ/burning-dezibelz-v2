import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from './database.types.ts' // import generated types

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
}

export {};
