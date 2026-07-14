/**
 * Local UserRole enum values that mirror @prisma/client's UserRole.
 *
 * This exists to break the dependency chain:
 *   client-component → constants/roles → @prisma/client → ❌ Prisma bundled in browser
 *
 * Using this file ensures no client-side code ever imports from @prisma/client.
 *
 * Server-side code (app/api/*, repositories/, services/, lib/auth.ts, lib/prisma.ts)
 * can still import UserRole directly from @prisma/client when needed for Prisma queries.
 */
export const UserRole = {
  ADMIN: "ADMIN" as const,
  SUPERVISOR: "SUPERVISOR" as const,
  PERMITTER: "PERMITTER" as const,
  SPG: "SPG" as const,
  CLIENT: "CLIENT" as const,
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const UserStatus = {
  PENDING: "PENDING" as const,
  ACTIVE: "ACTIVE" as const,
  REJECTED: "REJECTED" as const,
} as const;

export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const PreviousMilk = {
  SGM: "SGM" as const,
  SUSU_BUBUK: "SUSU_BUBUK" as const,
  NON_SUSU_BUBUK: "NON_SUSU_BUBUK" as const,
  NEW_TO_GUM: "NEW_TO_GUM" as const,
  OTHERS: "OTHERS" as const,
} as const;

export type PreviousMilk = (typeof PreviousMilk)[keyof typeof PreviousMilk];
