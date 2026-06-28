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

    const regions = await prisma.region.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });

    return successResponse(regions, "Regions retrieved successfully");
  } catch (error) {
    return handleApiError(error);
  }
});
