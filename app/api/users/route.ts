import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/errors";

export const GET = auth(async function GET(request) {
  try {
    const session = request.auth;
    if (!session?.user) {
      return errorResponse("Unauthorized", [], 401);
    }

    const url = new URL(request.url);
    const role = url.searchParams.get("role");

    const where = role ? { role } : {};

    const users = await prisma.user.findMany({
      where,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        regionId: true,
      },
    });

    return successResponse(users, "Users retrieved successfully");
  } catch (error) {
    return handleApiError(error);
  }
});
