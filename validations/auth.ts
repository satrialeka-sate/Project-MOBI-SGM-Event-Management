import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Registration schema for self-registration.
 *
 * - email: must be a valid email
 * - password: must follow existing policy (min 8 chars)
 * - phone: optional, must be valid digits/symbols if provided
 * - role: only SPG, Team Leader, or PERMITTER
 * - regionId: required, must be a non-empty string
 */
export const registerSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be at most 100 characters")
    .trim(),
  email: z
    .string()
    .email("Invalid email address")
    .max(255, "Email must be at most 255 characters")
    .trim()
    .toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters"),
  phone: z
    .string()
    .regex(/^[0-9+\-\s()]+$/, "Phone number is invalid")
    .max(20, "Phone number must be at most 20 characters")
    .trim()
    .optional()
    .or(z.literal("")),
  role: z.enum(["SPG", "TL", "PERMITTER"], {
    message: "Role must be SPG, Team Leader, or PERMITTER",
  }),
  regionId: z.string().min(1, "Region is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Approval schema for ADMIN PO to approve/reject users.
 */
export const approveUserSchema = z.object({
  action: z.enum(["approve", "reject"], {
    message: 'Action must be "approve" or "reject"',
  }),
  rejectionReason: z
    .string()
    .max(500, "Rejection reason must be at most 500 characters")
    .trim()
    .optional(),
});

export type ApproveUserInput = z.infer<typeof approveUserSchema>;
