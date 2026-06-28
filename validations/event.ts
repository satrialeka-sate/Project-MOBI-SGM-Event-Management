import { z } from "zod";

export const eventStatusEnum = z.enum([
  "SCHEDULED",
  "ONGOING",
  "COMPLETED",
  "CANCELLED",
]);

export const createEventSchema = z.object({
  permitterId: z.string().min(1, "Permitter is required"),
});

export const updateEventSchema = z.object({
  startTime: z.string().datetime().nullable().optional(),
  endTime: z.string().datetime().nullable().optional(),
  actualStartTime: z.string().datetime().nullable().optional(),
  actualEndTime: z.string().datetime().nullable().optional(),
  startedById: z.string().nullable().optional(),
  completedById: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  photoUrl: z.string().nullable().optional(),
  status: eventStatusEnum.optional(),
});

export const eventQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  status: eventStatusEnum.optional(),
  regionId: z.string().optional(),
  permitterId: z.string().optional(),
  spgId: z.string().optional(),
  sortBy: z
    .enum(["eventDate", "createdAt", "updatedAt", "status"])
    .default("eventDate"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type EventQueryInput = z.infer<typeof eventQuerySchema>;
