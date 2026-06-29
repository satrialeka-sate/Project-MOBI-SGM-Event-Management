import { USER_SCOPES } from "@/constants/user-scope";

/**
 * Check if a user's scope is limited to their region.
 */
export function isRegionScope(scope: string): boolean {
  return scope === USER_SCOPES.REGION;
}

/**
 * Check if a user's scope covers all regions.
 */
export function isGlobalScope(scope: string): boolean {
  return scope === USER_SCOPES.ALL;
}

/**
 * Determine whether a user can access data belonging to a given region.
 *
 * - Global scope (ALL): can access any region.
 * - Region scope (REGION): can only access their own region.
 */
export function canAccessRegion(
  userRegionId: string,
  targetRegionId: string,
  scope: string
): boolean {
  if (isGlobalScope(scope)) return true;
  return userRegionId === targetRegionId;
}

/**
 * Build a Prisma-compatible region filter based on the user's scope.
 *
 * Returns `{ regionId: userRegionId }` when scope is REGION,
 * or `undefined` when scope is ALL (no filter).
 */
export function buildRegionFilter(
  userRegionId: string,
  scope: string
): { regionId: string } | undefined {
  if (isGlobalScope(scope)) return undefined;
  return { regionId: userRegionId };
}

/**
 * Apply an actor's scope-based region filter to query parameters.
 *
 * If the actor has REGION scope, forces the region filter to the actor's region.
 * If the actor has ALL scope, returns params unchanged (no restriction).
 *
 * This is a generic utility that works with any params object that has
 * an optional `regionId` field.
 */
export function applyRegionFilter<T extends { regionId?: string }>(
  params: T,
  actor: { regionId: string; scope: string }
): T {
  const filter = buildRegionFilter(actor.regionId, actor.scope);
  if (!filter) return params;
  return { ...params, regionId: filter.regionId };
}
