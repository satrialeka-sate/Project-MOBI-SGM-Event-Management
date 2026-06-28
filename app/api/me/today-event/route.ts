import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/errors";
import { dashboardService } from "@/services/dashboard.service";

export const GET = auth(async function GET(request) {
  try {
    const session = request.auth;
    if (!session?.user) {
      return errorResponse("Unauthorized", [], 401);
    }

    requirePermission(session.user.role, PERMISSIONS.DASHBOARDS.READ_TODAY);

    const result = await dashboardService.getTodayEvent(session.user.id);

    return successResponse(
      result,
      result ? "Today's event retrieved successfully" : "No event scheduled for today"
    );
  } catch (error) {
    return handleApiError(error);
  }
});
