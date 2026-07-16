import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { SURVEY_PERMISSIONS } from "@/constants/survey-permissions";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/errors";
import type { ActorContext } from "@/types/auth";
import { surveyReportQuerySchema } from "@/validations/survey";
import { surveyService } from "@/services/survey.service";

export const GET = auth(async function GET(request) {
  try {
    const session = request.auth;
    if (!session?.user) {
      return errorResponse("Unauthorized", [], 401);
    }

    const parsed = surveyReportQuerySchema.safeParse(
      Object.fromEntries(new URL(request.url).searchParams)
    );
    if (!parsed.success) {
      return errorResponse("Validation failed", [], 422);
    }

    // Determine required permission based on filters
    // If no eventId or regionId → report all (surveys.read_all)
    // If eventId → report event (surveys.read)
    // If regionId → report region (surveys.read_region)
    const { eventId, regionId } = parsed.data;

    if (eventId) {
      // Report for a specific event — basic read permission
      requirePermission(session.user.role, SURVEY_PERMISSIONS.READ);
    } else if (regionId) {
      // Report for a region — need read_region permission
      requirePermission(session.user.role, SURVEY_PERMISSIONS.READ_REGION);
    } else {
      // Report all regions — need read_all permission
      requirePermission(session.user.role, SURVEY_PERMISSIONS.READ_ALL);
    }

    const actor: ActorContext = {
      id: session.user.id,
      role: session.user.role,
      level: session.user.level,
      scope: session.user.scope,
      regionId: session.user.regionId,
    };

    const report = await surveyService.getReport(actor, parsed.data);
    return successResponse(report, "Survey report retrieved successfully");
  } catch (error) {
    return handleApiError(error);
  }
});
