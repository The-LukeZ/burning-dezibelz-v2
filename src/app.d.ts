import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "./database.types.ts"; // import generated types

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

  interface Concert {
    id: string;
    name: string | null;
    date: string | null;
    location_id: string;
    notes: string[] | null;
    tickets:
      | {
          price: number | null;
          url: string | null;
          abendkasse: boolean;
          free: boolean;
        }
      | {
          price: null;
          url: null;
          abendkasse: false;
          free: true;
        }
      | {
          price: number;
          url: string | null;
          abendkasse: true;
          free: false;
        };
  }

  interface Location {
    id: string;
    name: string;
    address: string;
    city: string;
    postal_code: string;
    state: string;
    country: string;
    url: string;
  }
}

export {};
