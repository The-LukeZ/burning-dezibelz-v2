import { assets } from "$app/paths";

export const API_URL = "/api" as const;

export const UnknownVenue: VenueDetails = {
  id: "0",
  name: "Unbekannter Veranstaltungsort",
  address: "Unbekannte Adresse",
  city: "Unbekannte Stadt",
  country: "Unbekanntes Land",
  postal_code: "00000",
  state: "Unbekannter Bundesstaat",
  url: "https://example.com/unknown-venue",
} as const;

const protocol = import.meta.env.VITE_API_PROTOCOL || "http";
const origin = import.meta.env.VITE_API_ORIGIN || "localhost:9999";
export const CDNUrl = (fn: string) => `${protocol}://${origin}/cdn/${fn}` as const;
