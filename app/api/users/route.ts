import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/errors";
import { buildRegionFilter } from "@/lib/scope";
import bcrypt from "bcrypt";
import type { Prisma } from "@prisma/client";

export const GET = auth(async function GET(request) {
  try {
    const session = request.auth;
    if (!session?.user) {
      return errorResponse("Unauthorized", [], 401);
    }

    requirePermission(session.user.role, PERMISSIONS.USERS_MANAGEMENT.READ);

    const url = new URL(request.url);
    const roleParam = url.searchParams.get("role");

    const where: Prisma.UserWhereInput = {};
    if (roleParam) {
      where.role = roleParam as any;
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
        username: true,
        email: true,
        role: true,
        level: true,
        scope: true,
        regionId: true,
        isActive: true,
        image: true,
      },
    });

    return successResponse(users, "Users retrieved successfully");
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

    requirePermission(session.user.role, PERMISSIONS.USERS_MANAGEMENT.CREATE);

    const body = await request.json();

    // Validate required fields
    const { name, username, email, password, role, level, scope, regionId, isActive } = body;

    if (!name || !username || !email || !password || !role || !level || !scope || !regionId) {
      return errorResponse("All required fields must be provided", [], 422);
    }

    if (password.length < 8) {
      return errorResponse("Password must be at least 8 characters", [], 422);
    }

    // Check unique email
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return errorResponse("Email already exists", [], 409);
    }

    // Check unique username
    const existingUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUsername) {
      return errorResponse("Username already exists", [], 409);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        username,
        email,
        password: hashedPassword,
        role: role as any,
        level: level as any,
        scope: scope as any,
        regionId,
        isActive: isActive !== false,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        level: true,
        scope: true,
        regionId: true,
        isActive: true,
        image: true,
      },
    });

    return successResponse(user, "User created successfully", 201);
  } catch (error) {
    return handleApiError(error);
  }
});
