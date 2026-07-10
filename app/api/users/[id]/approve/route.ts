import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/errors";
import { UserRole } from "@/constants/prisma-enums";
import { USER_LEVELS } from "@/constants/user-level";
import { userService } from "@/services/user.service";
import { approveUserSchema } from "@/validations/auth";

export const PATCH = auth(async function PATCH(
  request: any,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = request.auth;
    if (!session?.user) {
      return errorResponse("Unauthorized", [], 401);
    }

    // Only ADMIN PO can approve/reject
    if (
      session.user.role !== UserRole.ADMIN ||
      session.user.level !== USER_LEVELS.PO
    ) {
      return errorResponse("Forbidden: only ADMIN PO can approve users", [], 403);
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = approveUserSchema.safeParse(body);

    if (!parsed.success) {
      return handleApiError(parsed.error);
    }

    const { action, rejectionReason } = parsed.data;

    if (action === "approve") {
      const user = await userService.approveUser(id, session.user.id);
      return successResponse(
        { id: user.id, status: user.status },
        "User approved successfully"
      );
    }

    // action === "reject"
    const user = await userService.rejectUser(id, session.user.id, rejectionReason);
    return successResponse(
      { id: user.id, status: user.status },
      "User rejected successfully"
    );
  } catch (error) {
    return handleApiError(error);
  }
});
