import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/errors";
import type { ActorContext } from "@/types/auth";
import { scheduleService } from "@/services/schedule.service";

export const GET = auth(async function GET(request) {
  try {
    const session = request.auth;
    if (!session?.user) {
      return errorResponse("Unauthorized", [], 401);
    }

    requirePermission(session.user.role, PERMISSIONS.SCHEDULES.READ);

    const url = new URL(request.url);
    const month = parseInt(url.searchParams.get("month") || "");
    const year = parseInt(url.searchParams.get("year") || "");
    const regionId = url.searchParams.get("regionId") || undefined;
    const cycle = url.searchParams.get("cycle") || undefined;

    if (isNaN(month) || isNaN(year)) {
      return errorResponse("month and year are required", [], 422);
    }

    const actor: ActorContext = {
      id: session.user.id,
      role: session.user.role,
      level: session.user.level,
      scope: session.user.scope,
      regionId: session.user.regionId,
    };

    const result = await scheduleService.getMonthlySchedule(actor, {
      month,
      year,
      regionId,
      cycle,
    });
    return successResponse(result, "Schedule retrieved successfully");
  } catch (error) {
    return handleApiError(error);
  }
});
