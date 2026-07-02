import { z } from "zod";

export const createMasterProductSchema = z.object({
  productName: z.string().min(1, "Product name is required").trim(),
  price: z.number().int().positive("Price must be a positive integer"),
  gimmick: z.string().min(1, "Gimmick is required").trim(),
});

export const updateMasterProductSchema = z.object({
  productName: z.string().min(1, "Product name is required").trim().optional(),
  price: z.number().int().positive("Price must be a positive integer").optional(),
  gimmick: z.string().min(1, "Gimmick is required").trim().optional(),
});

export const masterProductQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  sortBy: z
    .enum(["productName", "price", "createdAt", "updatedAt"])
    .default("productName"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export type CreateMasterProductInput = z.infer<typeof createMasterProductSchema>;
export type UpdateMasterProductInput = z.infer<typeof updateMasterProductSchema>;
export type MasterProductQueryInput = z.infer<typeof masterProductQuerySchema>;
