const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  SUPERVISOR: "Supervisor",
  PERMITTER: "Permitter",
  SPG: "SPG",
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
    ROLE_LABELS[role] ??
    role.charAt(0) + role.slice(1).toLowerCase().replace(/_/g, " ");

  if (!level) return rolePart;

  const levelPart =
    LEVEL_LABELS[level] ??
    level.charAt(0) + level.slice(1).toLowerCase().replace(/_/g, " ");

  return `${rolePart} ${levelPart}`;
}
