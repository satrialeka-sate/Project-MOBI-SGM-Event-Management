export const ROLES = {
  ADMIN: "ADMIN",
  PERMITTER: "PERMITTER",
  SPG: "SPG",
  SUPERVISOR: "SUPERVISOR",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
