export const PERMISSIONS = {
  USERS: {
    CREATE: "users.create",
    READ: "users.read",
    UPDATE: "users.update",
    DELETE: "users.delete",
  },
  PERMITTERS: {
    CREATE: "permitters.create",
    READ: "permitters.read",
    UPDATE: "permitters.update",
    DELETE: "permitters.delete",
  },
  EVENTS: {
    CREATE: "events.create",
    READ: "events.read",
    UPDATE: "events.update",
    DELETE: "events.delete",
  },
  REGIONS: {
    READ: "regions.read",
  },
  REPORTS: {
    READ: "reports.read",
  },
  ATTENDANCE: {
    CREATE: "attendance.create",
    READ: "attendance.read",
    UPDATE: "attendance.update",
    DELETE: "attendance.delete",
  },
  SELLINGS: {
    CREATE: "sellings.create",
    READ: "sellings.read",
    UPDATE: "sellings.update",
    DELETE: "sellings.delete",
  },
  CONTACTS: {
    CREATE: "contacts.create",
    READ: "contacts.read",
    UPDATE: "contacts.update",
    DELETE: "contacts.delete",
  },
  SCHEDULES: {
    READ: "schedules.read",
  },
  USERS_MANAGEMENT: {
    CREATE: "users_management.create",
    READ: "users_management.read",
    UPDATE: "users_management.update",
    DELETE: "users_management.delete",
  },
  APPROVAL: {
    APPROVE: "approval.approve",
    REJECT: "approval.reject",
  },
} as const;

type ExtractPermissions<T> = {
  [K in keyof T]: T[K] extends Record<string, infer V> ? V : never;
}[keyof T];

export type Permission = ExtractPermissions<typeof PERMISSIONS>;
