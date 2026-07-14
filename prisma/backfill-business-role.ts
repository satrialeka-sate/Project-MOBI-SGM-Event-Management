/**
 * Backfill script to populate the `businessRole` column for existing users.
 *
 * This script maps each existing user's (role, level, scope) combination
 * to the correct Business Role display name.
 *
 * ⚠️ Known Limitation:
 *   Users with (SUPERVISOR, PO, ALL) could be either "SGM" or "PO".
 *   These combinations are indistinguishable in the old data.
 *   This script defaults ambiguous records to "PO".
 *   Affected users should be manually corrected if they are SGM.
 */

import { PrismaClient, UserRole, UserLevel, UserScope } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/**
 * Mapping from (role, level, scope) to the correct business role label.
 *
 * ORDER MATTERS: more specific entries (with scope) must come before generic ones.
 * The first matching entry wins.
 */
interface RoleMapEntry {
  role: UserRole;
  level?: UserLevel;
  scope?: UserScope;
  businessRole: string;
}

const ROLE_MAP: RoleMapEntry[] = [
  // ── Supervisor group ──
  { role: UserRole.SUPERVISOR, level: UserLevel.PO,   businessRole: "PO" },       // ambiguous with SGM → defaults to PO
  { role: UserRole.SUPERVISOR, level: UserLevel.PIC, scope: UserScope.ALL,    businessRole: "Starlight" },
  { role: UserRole.SUPERVISOR, level: UserLevel.PIC, scope: UserScope.REGION, businessRole: "PIC" },
  { role: UserRole.SUPERVISOR, level: UserLevel.PIC,                          businessRole: "PIC" },  // fallback

  // ── Admin group ──
  { role: UserRole.ADMIN, level: UserLevel.PO,  businessRole: "Admin PO" },
  { role: UserRole.ADMIN, level: UserLevel.PIC, businessRole: "Admin PIC" },

  // ── Permitter group ──
  { role: UserRole.PERMITTER, level: UserLevel.PERMITTER, businessRole: "Permitter" },

  // ── SPG group ──
  { role: UserRole.SPG, level: UserLevel.TEAM_LEADER, businessRole: "Team Leader" },
  { role: UserRole.SPG, level: UserLevel.SPG,         businessRole: "SPG" },

  // ── Client group ──
  { role: UserRole.CLIENT, businessRole: "Client" },
];

function resolveBusinessRole(
  role: UserRole,
  level: UserLevel,
  scope: UserScope
): string {
  for (const entry of ROLE_MAP) {
    if (entry.role !== role) continue;
    if (entry.level !== undefined && entry.level !== level) continue;
    if (entry.scope !== undefined && entry.scope !== scope) continue;
    return entry.businessRole;
  }
  // Last resort: use the level value as-is
  return level;
}

async function main() {
  console.log("Fetching all users...");
  const users = await prisma.user.findMany({
    select: { id: true, role: true, level: true, scope: true, businessRole: true },
  });
  console.log(`Found ${users.length} users.`);

  let updated = 0;
  let skipped = 0;
  let ambiguous: Array<{ id: string; role: string; level: string; scope: string }> = [];

  for (const user of users) {
    // Skip users that already have a businessRole set and it differs from the default
    if (user.businessRole && user.businessRole !== "PERMITTER") {
      skipped++;
      continue;
    }

    const businessRole = resolveBusinessRole(
      user.role as UserRole,
      user.level as UserLevel,
      user.scope as UserScope
    );

    // Track ambiguous SUPERVISOR+PO+ALL → PO (could be SGM)
    if (
      user.role === UserRole.SUPERVISOR &&
      user.level === UserLevel.PO &&
      user.scope === UserScope.ALL
    ) {
      ambiguous.push({
        id: user.id,
        role: user.role,
        level: user.level,
        scope: user.scope,
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { businessRole },
    });
    updated++;
  }

  console.log(`\n✅ Backfill complete:`);
  console.log(`   - ${updated} users updated`);
  console.log(`   - ${skipped} users skipped (already set)`);

  if (ambiguous.length > 0) {
    console.log(`\n⚠️  ${ambiguous.length} user(s) with (SUPERVISOR, PO, ALL) were set to "PO".`);
    console.log(`   These COULD be "SGM" — please verify and update manually.`);
    console.log(`   Affected user IDs:`);
    for (const u of ambiguous) {
      console.log(`     - ${u.id} (${u.role}, ${u.level}, ${u.scope})`);
    }
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
