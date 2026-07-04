import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/errors";
import type { ActorContext } from "@/types/auth";
import { updateContactSchema } from "@/validations/contact";
import { contactService } from "@/services/contact.service";

export const DELETE = auth(async function DELETE(request, { params }: { params: Promise<{ contactId: string }> }) {
  try {
    const session = request.auth;
    if (!session?.user) {
      return errorResponse("Unauthorized", [], 401);
    }

    requirePermission(session.user.role, PERMISSIONS.CONTACTS.DELETE);

    const { contactId } = await params;

    const actor: ActorContext = {
      id: session.user.id,
      role: session.user.role,
      level: session.user.level,
      scope: session.user.scope,
      regionId: session.user.regionId,
    };

    await contactService.delete(actor, contactId);
    return successResponse(null, "Contact deleted successfully");
  } catch (error) {
    return handleApiError(error);
  }
});

export const PATCH = auth(async function PATCH(request, { params }: { params: Promise<{ contactId: string }> }) {
  try {
    const session = request.auth;
    if (!session?.user) {
      return errorResponse("Unauthorized", [], 401);
    }

    requirePermission(session.user.role, PERMISSIONS.CONTACTS.UPDATE);

    const { contactId } = await params;

    const body = await request.json();
    const parsed = updateContactSchema.safeParse(body);
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

    const contact = await contactService.update(actor, contactId, parsed.data);
    return successResponse(contact, "Contact updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
});
