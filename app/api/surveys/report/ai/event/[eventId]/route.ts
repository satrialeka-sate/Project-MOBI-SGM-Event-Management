import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { SURVEY_PERMISSIONS } from "@/constants/survey-permissions";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/errors";
import type { ActorContext } from "@/types/auth";
import { surveyAiQuerySchema } from "@/validations/survey";
import { surveyAiService } from "@/services/survey-ai.service";

/**
 * GET  /api/surveys/report/ai/event/[eventId]
 * Retrieve cached AI analysis for an event
 */
export const GET = auth(async function GET(
  request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = request.auth;
    if (!session?.user) {
      return errorResponse("Unauthorized", [], 401);
    }

    requirePermission(session.user.role, SURVEY_PERMISSIONS.READ);

    const { eventId } = await params;
    const actor: ActorContext = {
      id: session.user.id,
      role: session.user.role,
      level: session.user.level,
      scope: session.user.scope,
      regionId: session.user.regionId,
    };

    const analysis = await surveyAiService.getAnalysis(actor, { eventId });
    return successResponse(analysis, "AI analysis retrieved successfully");
  } catch (error) {
    return handleApiError(error);
  }
});

/**
 * POST  /api/surveys/report/ai/event/[eventId]
 * Generate (or regenerate) AI analysis for an event
 */
export const POST = auth(async function POST(
  request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = request.auth;
    if (!session?.user) {
      return errorResponse("Unauthorized", [], 401);
    }

    requirePermission(session.user.role, SURVEY_PERMISSIONS.READ);

    const { eventId } = await params;

    // Parse optional query params (startDate, endDate)
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

    const analysis = await surveyAiService.generateAnalysis(actor, {
      eventId,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
    });
    return successResponse(analysis, "AI analysis generated successfully");
  } catch (error) {
    return handleApiError(error);
  }
});
