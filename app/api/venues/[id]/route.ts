import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/errors";
import { updateVenueSchema } from "@/validations/venue";
import { venueService } from "@/services/venue.service";

export const GET = auth(async function GET(request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = request.auth;
    if (!session?.user) {
      return errorResponse("Unauthorized", [], 401);
    }

    requirePermission(session.user.role, PERMISSIONS.VENUES.READ);

    const { id } = await params;
    const venue = await venueService.getById(id);
    return successResponse(venue, "Venue retrieved successfully");
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

    requirePermission(session.user.role, PERMISSIONS.VENUES.UPDATE);

    const { id } = await params;
    const body = await request.json();
    const parsed = updateVenueSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Validation failed", [], 422);
    }

    const venue = await venueService.update(id, parsed.data);
    return successResponse(venue, "Venue updated successfully");
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

    requirePermission(session.user.role, PERMISSIONS.VENUES.DELETE);

    const { id } = await params;
    await venueService.delete(id);
    return successResponse(null, "Venue deleted successfully");
  } catch (error) {
    return handleApiError(error);
  }
});
