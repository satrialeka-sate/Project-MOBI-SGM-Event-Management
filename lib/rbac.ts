import type { Role } from "@/constants/roles";
import { ROLES } from "@/constants/roles";
import type { Permission } from "@/constants/permissions";
import { AppError } from "./errors";

const WILDCARD = "*";

/**
 * Role-permission mapping configuration.
 *
 * To add a new role, add an entry here with its permissions.
 * To grant new permissions to an existing role, add the permission string.
 * ADMIN uses a wildcard to automatically receive all current and future permissions.
 */
const rolePermissions: Record<Role, readonly string[]> = {
  [ROLES.ADMIN]: [WILDCARD],
  [ROLES.PERMITTER]: [
    "venues.read",
    "permitters.read",
    "permitters.create",
    "permitters.update",
    "events.create",
    "events.read",
  ],
  [ROLES.SPG]: ["events.read", "events.update", "transactions.create"],
  [ROLES.SUPERVISOR]: ["reports.read", "events.read", "permitters.read"],
};

/**
 * Check whether a role has a given permission.
 * ADMIN has all permissions via wildcard.
 */
export function hasPermission(role: string, permission: string): boolean {
  const permissions = rolePermissions[role as Role];
  if (!permissions) return false;
  return permissions.includes(WILDCARD) || permissions.includes(permission);
}

/**
 * Assert that a role has the required permission.
 * Throws an AppError (403) if the permission is missing,
 * which can be caught by handleApiError in API routes.
 */
export function requirePermission(
  role: string,
  permission: Permission
): void {
  if (!hasPermission(role, permission)) {
    throw new AppError("Forbidden: insufficient permissions", 403, [
      `Missing required permission: ${permission}`,
    ]);
  }
}

/**
 * Check whether a role is the admin role.
 */
export function isAdmin(role: string): boolean {
  return role === ROLES.ADMIN;
}
