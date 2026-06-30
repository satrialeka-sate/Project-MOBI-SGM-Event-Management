import { UserRole } from "@prisma/client";

const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: "Admin",
  [UserRole.SUPERVISOR]: "Supervisor",
  [UserRole.PERMITTER]: "Permitter",
  [UserRole.SPG]: "SPG",
};

const LEVEL_LABELS: Record<string, string> = {
  PIC: "PIC",
  PO: "PO",
  TEAM_LEADER: "Team Leader",
  SPG: "SPG",
  PERMITTER: "Permitter",
};

export function formatRoleLabel(role?: string, level?: string): string {
  if (!role) return "";

  const rolePart =
    ROLE_LABELS[role as UserRole] ??
    role.charAt(0) + role.slice(1).toLowerCase().replace(/_/g, " ");

  if (!level) return rolePart;

  const levelPart =
    LEVEL_LABELS[level] ??
    level.charAt(0) + level.slice(1).toLowerCase().replace(/_/g, " ");

  return `${rolePart} ${levelPart}`;
}
