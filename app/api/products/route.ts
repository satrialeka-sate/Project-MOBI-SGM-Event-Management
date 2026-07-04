import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/constants/permissions";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/errors";
import type { ActorContext } from "@/types/auth";
import { masterProductService } from "@/services/master-product.service";

export const GET = auth(async function GET(request) {
  try {
    const session = request.auth;
    if (!session?.user) {
      return errorResponse("Unauthorized", [], 401);
    }

    requirePermission(session.user.role, PERMISSIONS.SELLINGS.READ);

    const url = new URL(request.url);
    const search = url.searchParams.get("search");

    const actor: ActorContext = {
      id: session.user.id,
      role: session.user.role,
      level: session.user.level,
      scope: session.user.scope,
      regionId: session.user.regionId,
    };

    // If search param is present, return search results
    if (search !== null) {
      const products = await masterProductService.search(actor, search);
      return successResponse(products, "Products retrieved successfully");
    }

    const page = Number(url.searchParams.get("page")) || 1;
    const limit = Number(url.searchParams.get("limit")) || 20;

    const result = await masterProductService.list(actor, { page, limit });
    return successResponse(result, "Products retrieved successfully");
  } catch (error) {
    return handleApiError(error);
  }
});
