import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { SURVEY_PERMISSIONS } from "@/constants/survey-permissions";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/errors";
import type { ActorContext } from "@/types/auth";
import { surveyService } from "@/services/survey.service";

export const GET = auth(async function GET(request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = request.auth;
    if (!session?.user) {
      return errorResponse("Unauthorized", [], 401);
    }

    // SPG can read their own surveys; others need surveys.read
    if (session.user.role !== "SPG") {
      requirePermission(session.user.role, SURVEY_PERMISSIONS.READ);
    }

    const { id } = await params;

    const actor: ActorContext = {
      id: session.user.id,
      role: session.user.role,
      level: session.user.level,
      scope: session.user.scope,
      regionId: session.user.regionId,
    };

    const survey = await surveyService.getById(actor, id);
    return successResponse(survey, "Survey retrieved successfully");
  } catch (error) {
    return handleApiError(error);
  }
});
