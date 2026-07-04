import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/errors";
import type { ActorContext } from "@/types/auth";
import { updateSellingSchema } from "@/validations/selling";
import { sellingService } from "@/services/selling.service";

export const DELETE = auth(async function DELETE(request, { params }: { params: Promise<{ sellingId: string }> }) {
  try {
    const session = request.auth;
    if (!session?.user) {
      return errorResponse("Unauthorized", [], 401);
    }

    requirePermission(session.user.role, PERMISSIONS.SELLINGS.DELETE);

    const { sellingId } = await params;

    const actor: ActorContext = {
      id: session.user.id,
      role: session.user.role,
      level: session.user.level,
      scope: session.user.scope,
      regionId: session.user.regionId,
    };

    await sellingService.delete(actor, sellingId);
    return successResponse(null, "Selling deleted successfully");
  } catch (error) {
    return handleApiError(error);
  }
});

export const PATCH = auth(async function PATCH(request, { params }: { params: Promise<{ sellingId: string }> }) {
  try {
    const session = request.auth;
    if (!session?.user) {
      return errorResponse("Unauthorized", [], 401);
    }

    requirePermission(session.user.role, PERMISSIONS.SELLINGS.UPDATE);

    const { sellingId } = await params;

    const body = await request.json();
    const parsed = updateSellingSchema.safeParse(body);
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

    const selling = await sellingService.update(actor, sellingId, parsed.data);
    return successResponse(selling, "Selling updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
});
