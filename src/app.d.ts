import type { Database } from "$lib/supabase";
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
      /**
       * This is true if the user is an admin. This only serves the purpose of dynamically
       * displaying admin features in the UI and does not enforce any access control.
       *
       * This is not a security feature and can be passed to the page data.
       */
      isAdmin: boolean;
    }

    interface PageData {
      supabase: SupabaseClient<Database>;
      session: Session | null;
      user: User | null;
      /**
       * This is true if the user is an admin. Only for UI purposes.
       */
      isAdmin: boolean;
      currentISODate: string;
    }

    // interface PageState {}

    // interface Platform {}
  }

  type Concert = Database["public"]["Tables"]["concerts"]["Row"];

  type ConcertWithDetails = Concert & {
    venue: VenueDetails | null;
  };

  type VenueDetails = Database["public"]["Tables"]["venues"]["Row"];

  type Song = Database["public"]["Tables"]["songs"]["Row"];

  type AllowedUser = Database["public"]["Tables"]["allowed_users"]["Row"];

  type AllowedUserRole = Database["public"]["Enums"]["UserRole"];

  type Image = Database["public"]["Tables"]["images"]["Row"];

  type NavItem = {
    href: string;
    label: string;
    requiresAdmin?: boolean;
  };

  interface ImageParams {
    width?: number;
    height?: number;
    quality?: number;
    format?: "webp" | "avif" | "jpeg" | "png";
    fit?: "cover" | "contain" | "fill" | "inside" | "outside";
  }

  type ImageMimeTypes =
    | "image/jpg"
    | "image/jpeg"
    | "image/png"
    | "image/webp"
    | "image/gif"
    | "image/avif"
    | "image/bmp";
  type ImageExtension = "jpg" | "jpeg" | "png" | "webp" | "gif" | "avif" | "bmp";
}

export {};
