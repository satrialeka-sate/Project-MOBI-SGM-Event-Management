import { z } from "zod";

export const schoolSchema = z.object({
  name: z.string().min(1, "School name is required").trim(),
  schoolAddress: z.string().min(1, "School address is required").trim(),
  totalStudents: z.coerce
    .number()
    .int("Total students must be a whole number")
    .positive("Total students must be greater than zero"),
  picName: z.string().min(1, "PIC name is required").trim(),
  picPhone: z
    .string()
    .min(8, "PIC phone must be at least 8 characters")
    .max(15, "PIC phone must be at most 15 characters")
    .regex(/^[0-9+\-\s()]+$/, "PIC phone must contain only digits, +, -, spaces, or ()")
    .trim(),
});

export const createPermitterSchema = z.object({
  permitterId: z.string().min(1, "Permitter user is required"),
  spgId: z.string().min(1, "SPG user is required"),
  regionId: z.string().min(1, "Region is required"),
  cycle: z.string().min(1, "Cycle is required").trim(),
  venueName: z.string().min(1, "Venue name is required").trim(),
  venueCity: z.string().min(1, "Venue city is required").trim(),
  venueAddress: z.string().min(1, "Venue address is required").trim(),
  venuePIC: z.string().min(1, "Venue PIC is required").trim(),
  eventDate: z.coerce.date({ message: "Event date is required" }),
  status: z.string().default("active"),
  schools: z
    .array(schoolSchema)
    .min(1, "At least 1 school is required")
    .max(3, "Maximum 3 schools allowed"),
});

export const updatePermitterSchema = z.object({
  permitterId: z.string().min(1, "Permitter user is required").optional(),
  spgId: z.string().min(1, "SPG user is required").optional(),
  regionId: z.string().min(1, "Region is required").optional(),
  cycle: z.string().min(1, "Cycle is required").trim().optional(),
  venueName: z.string().min(1, "Venue name is required").trim().optional(),
  venueCity: z.string().min(1, "Venue city is required").trim().optional(),
  venueAddress: z.string().min(1, "Venue address is required").trim().optional(),
  venuePIC: z.string().min(1, "Venue PIC is required").trim().optional(),
  eventDate: z.coerce.date({ message: "Event date is required" }).optional(),
  status: z.string().optional(),
  schools: z
    .array(schoolSchema)
    .min(1, "At least 1 school is required")
    .max(3, "Maximum 3 schools allowed")
    .optional(),
});

export const permitterQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  regionId: z.string().optional(),
  userId: z.string().optional(),
  date: z.coerce.date().optional(),
  status: z.string().optional(),
  sortBy: z
    .enum(["eventDate", "createdAt", "updatedAt", "status"])
    .default("eventDate"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateSchoolInput = z.infer<typeof schoolSchema>;
export type CreatePermitterInput = z.infer<typeof createPermitterSchema>;
export type UpdatePermitterInput = z.infer<typeof updatePermitterSchema>;
export type PermitterQueryInput = z.infer<typeof permitterQuerySchema>;
