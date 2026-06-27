import { z } from "zod";

export const createVenueSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  kota: z.string().min(1, "Kota is required").trim(),
  alamat: z.string().min(1, "Alamat is required").trim(),
  picVenue: z.string().min(1, "PIC Venue is required").trim(),
  regionId: z.string().min(1, "Region is required"),
});

export const updateVenueSchema = z.object({
  name: z.string().min(1, "Name is required").trim().optional(),
  kota: z.string().min(1, "Kota is required").trim().optional(),
  alamat: z.string().min(1, "Alamat is required").trim().optional(),
  picVenue: z.string().min(1, "PIC Venue is required").trim().optional(),
  regionId: z.string().min(1, "Region is required").optional(),
});

export const venueQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  regionId: z.string().optional(),
  sortBy: z
    .enum(["name", "kota", "createdAt", "updatedAt"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateVenueInput = z.infer<typeof createVenueSchema>;
export type UpdateVenueInput = z.infer<typeof updateVenueSchema>;
export type VenueQueryInput = z.infer<typeof venueQuerySchema>;
