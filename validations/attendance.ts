import { z } from "zod";

const ALLOWED_PHOTO_FORMATS = ["image/jpeg", "image/png", "image/webp"];
const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * Validate that a base64-encoded image meets format and size requirements.
 */
function validatePhotoFormat(photo: string): boolean {
  // Check base64 header for format
  const formatMatch = photo.match(/^data:(image\/\w+);base64,/);
  if (!formatMatch) return false;

  const mimeType = formatMatch[1];
  if (!ALLOWED_PHOTO_FORMATS.includes(mimeType)) return false;

  // Estimate decoded size
  const base64Length = photo.replace(/^data:image\/\w+;base64,/, "").length;
  const estimatedBytes = Math.ceil(base64Length * 0.75);
  if (estimatedBytes > MAX_PHOTO_SIZE_BYTES) return false;

  return true;
}

export const createAttendanceSchema = z.object({
  photo: z.string().min(1, "Photo is required").refine(
    (val) => validatePhotoFormat(val),
    {
      message:
        "Only JPEG, PNG, and WebP images are allowed.",
    }
  ),
});

export const updateAttendanceSchema = z.object({
  photo: z
    .string()
    .min(1, "Photo is required")
    .refine((val) => validatePhotoFormat(val), {
      message:
        "Only JPEG, PNG, and WebP images are allowed.",
    })
    .optional(),
});

export type CreateAttendanceInput = z.infer<typeof createAttendanceSchema>;
export type UpdateAttendanceInput = z.infer<typeof updateAttendanceSchema>;
