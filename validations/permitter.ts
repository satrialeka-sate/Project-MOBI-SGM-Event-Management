import { z } from "zod";

export const schoolSchema = z.object({
  name: z.string().min(1, "School name is required").trim(),
  schoolAddress: z.string().min(1, "School address is required").trim(),
  totalStudents: z.coerce
    .number()
    .int("Total students must be a whole number")
    .positive("Total students must be greater than zero"),
  picName: z.string().min(1, "PIC name is required").trim(),
  picPhone: z.string().min(1, "PIC phone is required").trim(),
});

export const createPermitterSchema = z.object({
  permitterId: z.string().min(1, "Permitter user is required"),
  spgId: z.string().min(1, "SPG user is required"),
  venueId: z.string().min(1, "Venue is required"),
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
  venueId: z.string().min(1, "Venue is required").optional(),
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
  venueId: z.string().optional(),
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
