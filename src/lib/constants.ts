export const API_URL = "/api" as const;
export const IMAGE_URL = "/cdn" as const;

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
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
] as const;

export const allowedImageExtensions = ["jpg", "jpeg", "png", "webp", "gif", "avif"] as const;

export const JsonErrors = {
  /**
   * 400 Bad Request
   */
  badRequest: (message: string = "") => Response.json({ error: message || "Bad Request" }, { status: 400 }),
  /**
   * 401 Unauthorized
   */
  unauthorized: (message: string = "") =>
    Response.json({ error: message || "Unauthorized" }, { status: 401 }),
  /**
   * 403 Forbidden
   */
  forbidden: (message: string = "") => Response.json({ error: message || "Forbidden" }, { status: 403 }),
  /**
   * 404 Not Found
   */
  notFound: (message: string = "") => Response.json({ error: message || "Not Found" }, { status: 404 }),
  /**
   * 409 Conflict
   */
  conflict: (message: string = "") => Response.json({ error: message || "Conflict" }, { status: 409 }),
  /**
   * 429 Too Many Requests
   */
  tooManyRequests: (message: string = "") =>
    Response.json({ error: message || "Too Many Requests" }, { status: 429 }),
  /**
   * 500 Internal Server Error
   */
  serverError: (message: string = "") =>
    Response.json({ error: message || "Internal Server Error" }, { status: 500 }),
} as const;
