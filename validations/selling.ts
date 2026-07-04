import { z } from "zod";

export const previousMilkEnum = z.enum([
  "SGM",
  "SUSU_BUBUK",
  "NON_SUSU_BUBUK",
  "NEW_TO_GUM",
  "OTHERS",
]);

export const createSellingSchema = z.object({
  previousMilk: previousMilkEnum,
  productId: z.string().min(1, "Product is required"),
  sellingDate: z.string().optional(),
});

export const updateSellingSchema = z.object({
  previousMilk: previousMilkEnum.optional(),
  productId: z.string().min(1, "Product is required").optional(),
  sellingDate: z.string().optional(),
});

export type CreateSellingInput = z.infer<typeof createSellingSchema>;
export type UpdateSellingInput = z.infer<typeof updateSellingSchema>;
