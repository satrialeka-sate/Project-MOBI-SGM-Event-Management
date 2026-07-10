import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/errors";
import { registerSchema } from "@/validations/auth";
import { userService } from "@/services/user.service";

export const POST = async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return handleApiError(parsed.error);
    }

    await userService.register(parsed.data);

    return successResponse(
      null,
      "Registration submitted. Waiting for ADMIN PO approval.",
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
};
