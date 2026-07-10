/**
 * Client-safe permission checker for frontend UI.
 *
 * Mirrors the role-permission mapping from lib/rbac.ts without
 * importing AppError (which depends on next/server).
 *
 * Used exclusively for UI rendering decisions (show/hide buttons, menus).
 * Backend authorization via lib/rbac.ts remains the security layer.
 */
import type { Role } from "@/constants/roles";
import { ROLES } from "@/constants/roles";

const WILDCARD = "*";

/**
 * Role-permission mapping (must stay in sync with lib/rbac.ts).
 *
 * ADMIN        → CRUD semua module (wildcard)
 * SUPERVISOR   → Read Only semua module. No Create/Update/Delete.
 * PERMITTER    → Create/Read/Update Permitter only. No Delete. No Attendance/Selling/Contact.
 * SPG          → Read Event. Create/Read/Update Attendance, Selling, Contact. No Delete.
 * TEAM_LEADER  → Same as SPG (TEAM_LEADER uses role=SPG in database).
 */
const rolePermissions: Record<Role, readonly string[]> = {
  [ROLES.ADMIN]: [WILDCARD],
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

// ─── Convenience helpers for common checks ────────────────────────────────

export const can = {
  permitter: {
    read: (role: Role) => hasPermission(role, "permitters.read"),
    create: (role: Role) => hasPermission(role, "permitters.create"),
    update: (role: Role) => hasPermission(role, "permitters.update"),
    delete: (role: Role) => hasPermission(role, "permitters.delete"),
  },
  event: {
    read: (role: Role) => hasPermission(role, "events.read"),
    create: (role: Role) => hasPermission(role, "events.create"),
    update: (role: Role) => hasPermission(role, "events.update"),
    delete: (role: Role) => hasPermission(role, "events.delete"),
  },
  attendance: {
    read: (role: Role) => hasPermission(role, "attendance.read"),
    create: (role: Role) => hasPermission(role, "attendance.create"),
    update: (role: Role) => hasPermission(role, "attendance.update"),
    delete: (role: Role) => hasPermission(role, "attendance.delete"),
  },
  selling: {
    read: (role: Role) => hasPermission(role, "sellings.read"),
    create: (role: Role) => hasPermission(role, "sellings.create"),
    update: (role: Role) => hasPermission(role, "sellings.update"),
    delete: (role: Role) => hasPermission(role, "sellings.delete"),
  },
  contact: {
    read: (role: Role) => hasPermission(role, "contacts.read"),
    create: (role: Role) => hasPermission(role, "contacts.create"),
    update: (role: Role) => hasPermission(role, "contacts.update"),
    delete: (role: Role) => hasPermission(role, "contacts.delete"),
  },
  user: {
    read: (role: Role) => hasPermission(role, "users.read"),
    update: (role: Role) => hasPermission(role, "users.update"),
  },
  usersManagement: {
    create: (role: Role) => hasPermission(role, "users_management.create"),
    read: (role: Role) => hasPermission(role, "users_management.read"),
    update: (role: Role) => hasPermission(role, "users_management.update"),
    delete: (role: Role) => hasPermission(role, "users_management.delete"),
  },
  approval: {
    approve: (role: Role) => hasPermission(role, "approval.approve"),
    reject: (role: Role) => hasPermission(role, "approval.reject"),
  },
  region: {
    read: (role: Role) => hasPermission(role, "regions.read"),
  },
  report: {
    read: (role: Role) => hasPermission(role, "reports.read"),
  },
  schedule: {
    read: (role: Role) => hasPermission(role, "schedules.read"),
  },
} as const;
