import { UserRole } from "@/constants/prisma-enums";

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

  // Deduplicate when role and level produce the same label
  // e.g. "Permitter Permitter" → "Permitter", "SPG SPG" → "SPG"
  if (rolePart.toLowerCase() === levelPart.toLowerCase()) {
    return rolePart;
  }

  return `${rolePart} ${levelPart}`;
}
