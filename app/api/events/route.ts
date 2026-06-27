import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/errors";
import { createEventSchema, eventQuerySchema } from "@/validations/event";
import { eventService } from "@/services/event.service";

export const GET = auth(async function GET(request) {
  try {
    const session = request.auth;
    if (!session?.user) {
      return errorResponse("Unauthorized", [], 401);
    }

    requirePermission(session.user.role, PERMISSIONS.EVENTS.READ);

    const parsed = eventQuerySchema.safeParse(
      Object.fromEntries(new URL(request.url).searchParams)
    );
    if (!parsed.success) {
      return errorResponse("Validation failed", [], 422);
    }

    const result = await eventService.list(parsed.data);
    return successResponse(result, "Events retrieved successfully");
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

    requirePermission(session.user.role, PERMISSIONS.EVENTS.CREATE);

    const body = await request.json();
    const parsed = createEventSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Validation failed", [], 422);
    }

    const event = await eventService.create(parsed.data);
    return successResponse(event, "Event created successfully", 201);
  } catch (error) {
    return handleApiError(error);
  }
});
