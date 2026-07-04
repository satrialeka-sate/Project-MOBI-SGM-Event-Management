import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/errors";
import bcrypt from "bcrypt";

export const PATCH = auth(async function PATCH(request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = request.auth;
    if (!session?.user) {
      return errorResponse("Unauthorized", [], 401);
    }

    requirePermission(session.user.role, PERMISSIONS.USERS_MANAGEMENT.UPDATE);

    const { id } = await params;
    const body = await request.json();

    // Check user exists
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse("User not found", [], 404);
    }

    // Check unique email if changing
    if (body.email && body.email !== existing.email) {
      const emailUser = await prisma.user.findUnique({ where: { email: body.email } });
      if (emailUser) {
        return errorResponse("Email already exists", [], 409);
      }
    }

    // Check unique username if changing
    if (body.username && body.username !== existing.username) {
      const usernameUser = await prisma.user.findUnique({ where: { username: body.username } });
      if (usernameUser) {
        return errorResponse("Username already exists", [], 409);
      }
    }

    // Hash password if provided
    const updateData: Record<string, unknown> = { ...body };
    if (body.password) {
      if (body.password.length < 8) {
        return errorResponse("Password must be at least 8 characters", [], 422);
      }
      updateData.password = await bcrypt.hash(body.password, 12);
    } else {
      delete updateData.password;
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData as any,
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

    return successResponse(user, "User updated successfully");
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

    requirePermission(session.user.role, PERMISSIONS.USERS_MANAGEMENT.DELETE);

    const { id } = await params;

    // Check user exists
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse("User not found", [], 404);
    }

    // Prevent deleting yourself
    if (id === session.user.id) {
      return errorResponse("Cannot delete your own account", [], 400);
    }

    await prisma.user.delete({ where: { id } });

    return successResponse(null, "User deleted successfully");
  } catch (error) {
    return handleApiError(error);
  }
});
