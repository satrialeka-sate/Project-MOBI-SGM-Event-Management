import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { SURVEY_PERMISSIONS } from "@/constants/survey-permissions";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/errors";
import type { ActorContext } from "@/types/auth";
import { createSurveySchema, surveyQuerySchema } from "@/validations/survey";
import { surveyService } from "@/services/survey.service";

export const GET = auth(async function GET(request) {
  try {
    const session = request.auth;
    if (!session?.user) {
      return errorResponse("Unauthorized", [], 401);
    }

    // SPG can read their own surveys; others need surveys.read
    if (session.user.role !== "SPG") {
      requirePermission(session.user.role, SURVEY_PERMISSIONS.READ);
    }

    const parsed = surveyQuerySchema.safeParse(
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

    const result = await surveyService.list(actor, parsed.data);
    return successResponse(result, "Surveys retrieved successfully");
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

    requirePermission(session.user.role, SURVEY_PERMISSIONS.CREATE);

    const body = await request.json();
    const parsed = createSurveySchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Validation failed";
      return errorResponse(firstError, [], 400);
    }

    const actor: ActorContext = {
      id: session.user.id,
      role: session.user.role,
      level: session.user.level,
      scope: session.user.scope,
      regionId: session.user.regionId,
    };

    const survey = await surveyService.create(actor, parsed.data);
    return successResponse(survey, "Survey created successfully", 201);
  } catch (error) {
    return handleApiError(error);
  }
});
