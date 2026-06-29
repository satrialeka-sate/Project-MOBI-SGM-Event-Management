import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/errors";
import type { ActorContext } from "@/types/auth";
import { updateEventSchema } from "@/validations/event";
import { eventService } from "@/services/event.service";

export const GET = auth(async function GET(request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = request.auth;
    if (!session?.user) {
      return errorResponse("Unauthorized", [], 401);
    }

    requirePermission(session.user.role, PERMISSIONS.EVENTS.READ);

    const { id } = await params;

    const actor: ActorContext = {
      id: session.user.id,
      role: session.user.role,
      level: session.user.level,
      scope: session.user.scope,
      regionId: session.user.regionId,
    };

    const event = await eventService.getById(actor, id);
    return successResponse(event, "Event retrieved successfully");
  } catch (error) {
    return handleApiError(error);
  }
});

export const PATCH = auth(async function PATCH(request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = request.auth;
    if (!session?.user) {
      return errorResponse("Unauthorized", [], 401);
    }

    requirePermission(session.user.role, PERMISSIONS.EVENTS.UPDATE);

    const { id } = await params;

    const body = await request.json();
    const parsed = updateEventSchema.safeParse(body);
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

    const event = await eventService.update(actor, id, parsed.data);
    return successResponse(event, "Event updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
});

export const DELETE = auth(async function DELETE(request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = request.auth;
    if (!session?.user) {
      return errorResponse("Unauthorized", [], 401);
    }

    requirePermission(session.user.role, PERMISSIONS.EVENTS.DELETE);

    const { id } = await params;

    const actor: ActorContext = {
      id: session.user.id,
      role: session.user.role,
      level: session.user.level,
      scope: session.user.scope,
      regionId: session.user.regionId,
    };

    await eventService.delete(actor, id);
    return successResponse(null, "Event deleted successfully");
  } catch (error) {
    return handleApiError(error);
  }
});
