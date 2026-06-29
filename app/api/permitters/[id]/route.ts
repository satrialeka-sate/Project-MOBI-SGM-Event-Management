import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/errors";
import type { ActorContext } from "@/types/auth";
import { permitterService } from "@/services/permitter.service";
import { updatePermitterSchema } from "@/validations/permitter";

export const GET = auth(async function GET(request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = request.auth;
    if (!session?.user) {
      return errorResponse("Unauthorized", [], 401);
    }

    requirePermission(session.user.role, PERMISSIONS.PERMITTERS.READ);

    const actor: ActorContext = {
      id: session.user.id,
      role: session.user.role,
      level: session.user.level,
      scope: session.user.scope,
      regionId: session.user.regionId,
    };

    const { id } = await params;
    const permitter = await permitterService.getById(actor, id);
    return successResponse(permitter, "Permitter retrieved successfully");
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

    requirePermission(session.user.role, PERMISSIONS.PERMITTERS.UPDATE);

    const { id } = await params;

    const body = await request.json();
    const parsed = updatePermitterSchema.safeParse(body);
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

    const permitter = await permitterService.update(actor, id, parsed.data);
    return successResponse(permitter, "Permitter updated successfully");
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

    requirePermission(session.user.role, PERMISSIONS.PERMITTERS.DELETE);

    const { id } = await params;

    const actor: ActorContext = {
      id: session.user.id,
      role: session.user.role,
      level: session.user.level,
      scope: session.user.scope,
      regionId: session.user.regionId,
    };

    await permitterService.delete(actor, id);
    return successResponse(null, "Permitter deleted successfully");
  } catch (error) {
    return handleApiError(error);
  }
});
