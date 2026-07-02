import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/errors";
import type { ActorContext } from "@/types/auth";
import { updateAttendanceSchema } from "@/validations/attendance";
import { attendanceService } from "@/services/attendance.service";

export const DELETE = auth(async function DELETE(request, { params }: { params: Promise<{ attendanceId: string }> }) {
  try {
    const session = request.auth;
    if (!session?.user) {
      return errorResponse("Unauthorized", [], 401);
    }

    requirePermission(session.user.role, PERMISSIONS.ATTENDANCE.DELETE);

    const { attendanceId } = await params;

    const actor: ActorContext = {
      id: session.user.id,
      role: session.user.role,
      level: session.user.level,
      scope: session.user.scope,
      regionId: session.user.regionId,
    };

    await attendanceService.delete(actor, attendanceId);
    return successResponse(null, "Attendance deleted successfully");
  } catch (error) {
    return handleApiError(error);
  }
});

export const PATCH = auth(async function PATCH(request, { params }: { params: Promise<{ attendanceId: string }> }) {
  try {
    const session = request.auth;
    if (!session?.user) {
      return errorResponse("Unauthorized", [], 401);
    }

    requirePermission(session.user.role, PERMISSIONS.ATTENDANCE.UPDATE);

    const { attendanceId } = await params;

    const body = await request.json();
    const parsed = updateAttendanceSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Only JPEG, PNG, and WebP images are allowed.";
      return errorResponse(firstError, [], 400);
    }

    const actor: ActorContext = {
      id: session.user.id,
      role: session.user.role,
      level: session.user.level,
      scope: session.user.scope,
      regionId: session.user.regionId,
    };

    const attendance = await attendanceService.update(actor, attendanceId, parsed.data);
    return successResponse(attendance, "Attendance updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
});
