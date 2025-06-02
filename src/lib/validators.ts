import { z } from "zod";

// Concert Type enum schema
const ConcertTypeSchema = z.enum(["public", "closed"]);

// Concert validator based on the Insert type (for creating new concerts)
export const ConcertCreateSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).nullable().optional(),
  timestamp: z.string().datetime(),
  type: ConcertTypeSchema.optional(),
  venue_id: z.string().uuid().nullable().optional(),
  image: z.string().uuid().nullable().optional(),
  price: z.number().positive().nullable().optional(),
  ticket_url: z.string().url().nullable().optional(),
  notes: z.string().nullable().optional(),
  free: z.boolean().optional(),
  abendkasse: z.boolean().optional(),
});

// Venue validator based on the Insert type
export const VenueSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  postal_code: z.string().min(1),
  state: z.string().min(1),
  country: z.string().min(1),
  url: z.string().url(),
});

// Update schemas (all fields optional)
export const ConcertUpdateSchema = ConcertCreateSchema.partial();
export const VenueUpdateSchema = VenueSchema.partial();
