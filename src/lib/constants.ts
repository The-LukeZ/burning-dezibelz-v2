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
