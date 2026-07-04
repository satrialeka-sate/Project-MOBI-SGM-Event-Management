import { z } from "zod";

export const eventStatusEnum = z.enum([
  "UPCOMING",
  "ONGOING",
  "COMPLETED",
]);

export const eventQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  status: eventStatusEnum.optional(),
  regionId: z.string().optional(),
  date: z.string().optional(),
  sortBy: z
    .enum(["eventDate", "createdAt", "updatedAt"])
    .default("eventDate"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type EventQueryInput = z.infer<typeof eventQuerySchema>;
