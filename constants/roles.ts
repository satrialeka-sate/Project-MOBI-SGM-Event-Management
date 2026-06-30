import { UserRole } from "@prisma/client";

export const ROLES = {
  ADMIN: UserRole.ADMIN,
  PERMITTER: UserRole.PERMITTER,
  SPG: UserRole.SPG,
  SUPERVISOR: UserRole.SUPERVISOR,
} as const;

export type Role = UserRole;
