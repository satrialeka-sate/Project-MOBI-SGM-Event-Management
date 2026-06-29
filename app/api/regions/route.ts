import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/errors";
import { buildRegionFilter } from "@/lib/scope";

export const GET = auth(async function GET(request) {
  try {
    const session = request.auth;
    if (!session?.user) {
      return errorResponse("Unauthorized", [], 401);
    }

    requirePermission(session.user.role, PERMISSIONS.REGIONS.READ);

    const regionFilter = buildRegionFilter(session.user.regionId, session.user.scope);
    const where = regionFilter?.regionId ? { id: regionFilter.regionId } : {};

    const regions = await prisma.region.findMany({
      where,
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });

    return successResponse(regions, "Regions retrieved successfully");
  } catch (error) {
    return handleApiError(error);
  }
});
