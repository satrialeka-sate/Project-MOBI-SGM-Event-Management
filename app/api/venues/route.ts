import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/errors";
import { createVenueSchema, venueQuerySchema } from "@/validations/venue";
import { venueService } from "@/services/venue.service";

export const GET = auth(async function GET(request) {
  try {
    const session = request.auth;
    if (!session?.user) {
      return errorResponse("Unauthorized", [], 401);
    }

    requirePermission(session.user.role, PERMISSIONS.VENUES.READ);

    const parsed = venueQuerySchema.safeParse(
      Object.fromEntries(new URL(request.url).searchParams)
    );
    if (!parsed.success) {
      return errorResponse("Validation failed", [], 422);
    }

    const result = await venueService.list(parsed.data);
    return successResponse(result, "Venues retrieved successfully");
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

    requirePermission(session.user.role, PERMISSIONS.VENUES.CREATE);

    const body = await request.json();
    const parsed = createVenueSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Validation failed", [], 422);
    }

    const venue = await venueService.create(parsed.data);
    return successResponse(venue, "Venue created successfully", 201);
  } catch (error) {
    return handleApiError(error);
  }
});
