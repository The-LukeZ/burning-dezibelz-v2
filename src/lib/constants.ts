export const API_URL = "/api" as const;
export const IMAGE_URL = "/images" as const;

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

export const allowedMimeTypes = [
  "image/jpg",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/svg+xml",
  "image/bmp",
] as const;

export const allowedImageExtensions = ["jpg", "jpeg", "png", "webp", "gif", "avif", "svg", "bmp"] as const;

export const JsonErrors = {
  badRequest: (message: string = "") => Response.json({ error: message || "Bad Request" }, { status: 400 }),
  unauthorized: (message: string = "") =>
    Response.json({ error: message || "Unauthorized" }, { status: 401 }),
  forbidden: (message: string = "") => Response.json({ error: message || "Forbidden" }, { status: 403 }),
  notFound: (message: string = "") => Response.json({ error: message || "Not Found" }, { status: 404 }),
  internalServerError: (message: string = "") =>
    Response.json({ error: message || "Internal Server Error" }, { status: 500 }),
} as const;
