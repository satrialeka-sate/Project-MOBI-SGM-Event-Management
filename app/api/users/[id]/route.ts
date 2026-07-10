import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/errors";
import { userService } from "@/services/user.service";

export const GET = auth(async function GET(
  _request: any,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = _request.auth;
    if (!session?.user) {
      return errorResponse("Unauthorized", [], 401);
    }

    requirePermission(session.user.role, PERMISSIONS.USERS_MANAGEMENT.READ);

    const { id } = await params;
    const user = await userService.getById(id);

    return successResponse(user, "User retrieved successfully");
  } catch (error) {
    return handleApiError(error);
  }
});

export const PATCH = auth(async function PATCH(
  request: any,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = request.auth;
    if (!session?.user) {
      return errorResponse("Unauthorized", [], 401);
    }

    requirePermission(session.user.role, PERMISSIONS.USERS_MANAGEMENT.UPDATE);

    const { id } = await params;
    const body = await request.json();
    const user = await userService.update(id, body);

    return successResponse(user, "User updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
});

export const DELETE = auth(async function DELETE(
  request: any,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = request.auth;
    if (!session?.user) {
      return errorResponse("Unauthorized", [], 401);
    }

    requirePermission(session.user.role, PERMISSIONS.USERS_MANAGEMENT.DELETE);

    const { id } = await params;
    await userService.delete(id, session.user.id);

    return successResponse(null, "User deleted successfully");
  } catch (error) {
    return handleApiError(error);
  }
});
