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
 *
 * Permission matrix (updated per client requirements):
 *
 * ADMIN        → CRUD semua module (wildcard)
 * SUPERVISOR   → Read Only semua module. No Create/Update/Delete.
 * PERMITTER    → Create/Read/Update Permitter only. No Delete. No Attendance/Selling/Contact.
 * SPG          → Read Event. Create/Read/Update Attendance, Selling, Contact. No Delete.
 * TEAM_LEADER  → Same as SPG (TEAM_LEADER uses role=SPG in database).
 */
const rolePermissions: Record<Role, readonly string[]> = {
  [ROLES.ADMIN]: [WILDCARD, "users_management.create", "users_management.read", "users_management.update", "users_management.delete", "approval.approve", "approval.reject"],
  [ROLES.PERMITTER]: [
    "permitters.read",
    "permitters.create",
    "permitters.update",
    "regions.read",
    "schedules.read",
  ],
  [ROLES.SPG]: [
    "events.read",
    "attendance.read",
    "attendance.create",
    "attendance.update",
    "sellings.read",
    "sellings.create",
    "sellings.update",
    "contacts.read",
    "contacts.create",
    "contacts.update",
    "regions.read",
  ],
  [ROLES.SUPERVISOR]: [
    "users.read",
    "permitters.read",
    "events.read",
    "attendance.read",
    "sellings.read",
    "contacts.read",
    "reports.read",
    "regions.read",
    "schedules.read",
  ],
};

/**
 * Check whether a role has a given permission.
 * ADMIN has all permissions via wildcard.
 */
export function hasPermission(role: Role, permission: string): boolean {
  const permissions = rolePermissions[role];
  if (!permissions) return false;
  return permissions.includes(WILDCARD) || permissions.includes(permission);
}

/**
 * Assert that a role has the required permission.
 * Throws an AppError (403) if the permission is missing,
 * which can be caught by handleApiError in API routes.
 */
export function requirePermission(
  role: Role,
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
export function isAdmin(role: Role): boolean {
  return role === ROLES.ADMIN;
}

/**
 * Check whether a role is a supervisor.
 */
export function isSupervisor(role: Role): boolean {
  return role === ROLES.SUPERVISOR;
}

/**
 * Check whether a role has write (create/update/delete) capabilities.
 * Only ADMIN has full write access; SUPERVISOR is read-only.
 */
export function canWrite(role: Role): boolean {
  return role === ROLES.ADMIN || role === ROLES.PERMITTER || role === ROLES.SPG;
}
