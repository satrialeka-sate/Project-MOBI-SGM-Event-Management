import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/errors";
import { buildRegionFilter } from "@/lib/scope";
import type { Prisma, UserRole } from "@prisma/client";

export const GET = auth(async function GET(request) {
  try {
    const session = request.auth;
    if (!session?.user) {
      return errorResponse("Unauthorized", [], 401);
    }

    requirePermission(session.user.role, PERMISSIONS.USERS.READ);

    const url = new URL(request.url);
    const roleParam = url.searchParams.get("role");

    const where: Prisma.UserWhereInput = {};
    if (roleParam) {
      where.role = roleParam as UserRole;
    }

    // Apply scope-based region filtering
    const regionFilter = buildRegionFilter(session.user.regionId, session.user.scope);
    if (regionFilter?.regionId) {
      where.regionId = regionFilter.regionId;
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        level: true,
        scope: true,
        regionId: true,
      },
    });

    return successResponse(users, "Users retrieved successfully");
  } catch (error) {
    return handleApiError(error);
  }
});
