import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/errors";
import { buildRegionFilter } from "@/lib/scope";
import { userService } from "@/services/user.service";
import { userRepository } from "@/repositories/user.repository";
import bcrypt from "bcrypt";
import type { UserRole } from "../../../generated/prisma/client";

export const GET = auth(async function GET(request) {
  try {
    const session = request.auth;
    if (!session?.user) {
      return errorResponse("Unauthorized", [], 401);
    }

    requirePermission(session.user.role, PERMISSIONS.USERS_MANAGEMENT.READ);

    const url = new URL(request.url);
    const roleParam = url.searchParams.get("role");

    const where: Record<string, unknown> = {};
    if (roleParam) {
      where.role = roleParam;
    }

    // Apply scope-based region filtering
    const regionFilter = buildRegionFilter(session.user.regionId, session.user.scope);
    if (regionFilter?.regionId) {
      where.regionId = regionFilter.regionId;
    }

    const users = await userRepository.findAll(where as any);
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
    const { name, username, email, phone, password, role, level, scope, businessRole, regionId, isActive } = body;

    // Validate required fields
    if (!name || !username || !email || !password || !role || !level || !scope || !regionId) {
      return errorResponse("All required fields must be provided", [], 422);
    }

    if (password.length < 8) {
      return errorResponse("Password must be at least 8 characters", [], 422);
    }

    // Check unique email
    const existingEmail = await userRepository.findByEmail(email);
    if (existingEmail) {
      return errorResponse("Email already exists", [], 409);
    }

    // Check unique username
    const existingUsername = await userRepository.findByUsername(username);
    if (existingUsername) {
      return errorResponse("Username already exists", [], 409);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await userRepository.create({
      name,
      username,
      email,
      phone,
      password: hashedPassword,
      role: role as any,
      level: level as any,
      scope: scope as any,
      businessRole: businessRole || level,
      regionId,
      isActive: isActive !== false,
    });

    return successResponse(user, "User created successfully", 201);
  } catch (error) {
    return handleApiError(error);
  }
});
