import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/errors";
import { buildRegionFilter } from "@/lib/scope";
import { excludeLegacyRegionsFilter } from "@/constants/regions";
import type { Prisma } from "../../../generated/prisma/client";

export const GET = auth(async function GET(request) {
  try {
    console.log("REGIONS ROUTE HIT");
    console.log("[REGIONS DEBUG] handler CALLED at", new Date().toISOString());
    const session = request.auth;
    console.log("[REGIONS DEBUG] session:", JSON.stringify(session));

    // Build region filter based on scope (if authenticated)
    const where: Prisma.RegionWhereInput = {
      name: excludeLegacyRegionsFilter(),
    };
    console.log("[REGIONS DEBUG] where filter:", JSON.stringify(where));

    if (session?.user) {
      const regionFilter = buildRegionFilter(session.user.regionId, session.user.scope);
      if (regionFilter?.regionId) {
        where.id = regionFilter.regionId;
      }
    }

    console.log("[REGIONS DEBUG] final where:", JSON.stringify(where));
    console.log("[REGIONS DEBUG] about to query Prisma...");
    const regions = await prisma.region.findMany({
      where,
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
    console.log("[REGIONS DEBUG] Prisma result:", JSON.stringify(regions));
    console.log("[REGIONS DEBUG] result length:", regions.length);

    const response = successResponse(regions, "Regions retrieved successfully");
    console.log("[REGIONS DEBUG] response status:", response.status);
    console.log("[REGIONS DEBUG] response body (cloned):", await response.clone().json());
    return response;
  } catch (error) {
    console.error("[REGIONS DEBUG] CATCH error:", error);
    return handleApiError(error);
  }
});
