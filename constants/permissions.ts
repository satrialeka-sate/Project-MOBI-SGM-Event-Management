export const PERMISSIONS = {
  USERS: {
    CREATE: "users.create",
    READ: "users.read",
    UPDATE: "users.update",
    DELETE: "users.delete",
  },
  VENUES: {
    CREATE: "venues.create",
    READ: "venues.read",
    UPDATE: "venues.update",
    DELETE: "venues.delete",
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
  REPORTS: {
    READ: "reports.read",
  },
  TRANSACTIONS: {
    CREATE: "transactions.create",
    READ: "transactions.read",
  },
} as const;

type ExtractPermissions<T> = {
  [K in keyof T]: T[K] extends Record<string, infer V> ? V : never;
}[keyof T];

export type Permission = ExtractPermissions<typeof PERMISSIONS>;
