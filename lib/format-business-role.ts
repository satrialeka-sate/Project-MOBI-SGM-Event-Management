/**
 * Format a user's business role for display in the UI.
 *
 * Now reads the stored `businessRole` column directly — no more inferring
 * from (role, level, scope) combinations.
 *
 * Fallback chain:
 *   1. If businessRole is provided and non-empty → return it as-is
 *   2. Fall back to format from (role, level) for backward compatibility
 *   3. Last resort → return the raw level value
 *
 * This is PURELY a UI concern — authorization, RBAC, and all
 * internal mappings remain unchanged.
 */

const FALLBACK_LABELS: Record<string, Record<string, string>> = {
  SUPERVISOR: {
    PO: "PO",
    PIC: "PIC",
  },
  ADMIN: {
    PO: "Admin PO",
    PIC: "Admin PIC",
  },
  PERMITTER: {
    PERMITTER: "Permitter",
  },
  SPG: {
    SPG: "SPG",
    TEAM_LEADER: "Team Leader",
  },
  CLIENT: {},
};

/**
 * Format a user's business role for display.
 *
 * @param businessRole - The stored business role (e.g. "SGM", "Starlight", "Admin PO")
 * @param role         - Authorization role, only used as fallback
 * @param level        - User level, only used as fallback
 */
export function formatBusinessRole(
  businessRole?: string | null,
  role?: string,
  level?: string
): string {
  // 1. If we have a stored businessRole, return it directly
  if (businessRole && businessRole.trim().length > 0) {
    return businessRole;
  }

  // 2. Fallback: use (role, level) mapping for backward compatibility
  if (role && level) {
    const roleGroup = FALLBACK_LABELS[role];
    if (roleGroup && roleGroup[level]) {
      return roleGroup[level];
    }
    return level;
  }

  // 3. Last resort
  return level ?? businessRole ?? "";
}
