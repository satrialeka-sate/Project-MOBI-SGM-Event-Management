import { z } from "zod";

export const createContactSchema = z.object({
  totalContact: z.coerce
    .number()
    .int("Total contact must be a whole number")
    .nonnegative("Total contact must be zero or greater"),
  contactDate: z.string().optional(),
});

export const updateContactSchema = z.object({
  totalContact: z.coerce
    .number()
    .int("Total contact must be a whole number")
    .nonnegative("Total contact must be zero or greater")
    .optional(),
  contactDate: z.string().optional(),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
