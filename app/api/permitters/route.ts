import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/errors";
import { createPermitterSchema, permitterQuerySchema } from "@/validations/permitter";
import { permitterService } from "@/services/permitter.service";

export const GET = auth(async function GET(request) {
  try {
    const session = request.auth;
    if (!session?.user) {
      return errorResponse("Unauthorized", [], 401);
    }

    requirePermission(session.user.role, PERMISSIONS.PERMITTERS.READ);

    const parsed = permitterQuerySchema.safeParse(
      Object.fromEntries(new URL(request.url).searchParams)
    );
    if (!parsed.success) {
      return errorResponse("Validation failed", [], 422);
    }

    const result = await permitterService.list(parsed.data);
    return successResponse(result, "Permitters retrieved successfully");
  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = auth(async function POST(request) {
  try {
    const session = request.auth;
    if (!session?.user) {
      return errorResponse("Unauthorized", [], 401);
    }

    requirePermission(session.user.role, PERMISSIONS.PERMITTERS.CREATE);

    const body = await request.json();
    const parsed = createPermitterSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Validation failed", [], 422);
    }

    const permitter = await permitterService.create(parsed.data);
    return successResponse(permitter, "Permitter created successfully", 201);
  } catch (error) {
    return handleApiError(error);
  }
});
