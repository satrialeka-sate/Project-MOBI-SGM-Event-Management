import { UserRole } from "@/constants/prisma-enums";

export const ROLES = {
  ADMIN: UserRole.ADMIN,
  PERMITTER: UserRole.PERMITTER,
  SPG: UserRole.SPG,
  SUPERVISOR: UserRole.SUPERVISOR,
  CLIENT: UserRole.CLIENT,
} as const;

export type Role = UserRole;
