import { auth } from "@/lib/auth";
import { requirePermission, hasPermission } from "@/lib/rbac";
import { SURVEY_PERMISSIONS } from "@/constants/survey-permissions";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/errors";
import type { ActorContext } from "@/types/auth";
import { surveyAiQuerySchema } from "@/validations/survey";
import { surveyAiService } from "@/services/survey-ai.service";

/**
 * GET  /api/surveys/report/ai/questions
 * Retrieve cached per-question AI analyses for the given scope.
 */
export const GET = auth(async function GET(request) {
  try {
    const session = request.auth;
    if (!session?.user) {
      return errorResponse("Unauthorized", [], 401);
    }

    // Viewing analyses requires survey read permission
    requirePermission(session.user.role, SURVEY_PERMISSIONS.READ);

    const parsed = surveyAiQuerySchema.safeParse(
      Object.fromEntries(new URL(request.url).searchParams)
    );
    if (!parsed.success) {
      return errorResponse("Validation failed", [], 422);
    }

    const actor: ActorContext = {
      id: session.user.id,
      role: session.user.role,
      level: session.user.level,
      scope: session.user.scope,
      regionId: session.user.regionId,
    };

    const analyses = await surveyAiService.getQuestionAnalyses(actor, {
      eventId: parsed.data.eventId,
      regionId: parsed.data.regionId,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
    });
    return successResponse(analyses, "Question analyses retrieved successfully");
  } catch (error) {
    return handleApiError(error);
  }
});

/**
 * POST  /api/surveys/report/ai/questions
 * Generate (or regenerate) per-question AI analyses for all survey questions.
 */
export const POST = auth(async function POST(request) {
  try {
    const session = request.auth;
    if (!session?.user) {
      return errorResponse("Unauthorized", [], 401);
    }

    // Generating comparisons requires region or all access
    if (
      !hasPermission(session.user.role, SURVEY_PERMISSIONS.READ_REGION) &&
      !hasPermission(session.user.role, SURVEY_PERMISSIONS.READ_ALL)
    ) {
      return errorResponse("Forbidden: insufficient permissions", [], 403);
    }

    // Parse optional query params (eventId, startDate, endDate)
    const parsed = surveyAiQuerySchema.safeParse(
      Object.fromEntries(new URL(request.url).searchParams)
    );
    if (!parsed.success) {
      return errorResponse("Validation failed", [], 422);
    }

    const actor: ActorContext = {
      id: session.user.id,
      role: session.user.role,
      level: session.user.level,
      scope: session.user.scope,
      regionId: session.user.regionId,
    };

    const analyses = await surveyAiService.generateQuestionAnalyses(actor, {
      eventId: parsed.data.eventId,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
    });
    return successResponse(analyses, "Question analyses generated successfully");
  } catch (error) {
    return handleApiError(error);
  }
});
