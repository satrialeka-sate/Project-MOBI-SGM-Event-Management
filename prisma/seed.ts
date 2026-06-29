import { PrismaClient, UserLevel, UserScope } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcrypt";

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 10);

  // ── Regions ────────────────────────────────────────────────────────────
  const regions = ["STARLIGHT", "JABAR", "JATIM", "JATENG"];

  const regionRecords: Record<string, { id: string }> = {};

  for (const name of regions) {
    const region = await prisma.region.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    regionRecords[name] = region;
  }

  console.log("✅ Regions seeded");

  // ── Users ──────────────────────────────────────────────────────────────
  // Semua password: admin123 (hash di-generate sekali di atas)
  const users = [
    {
      name: "Admin PIC Jabar",
      email: "admin.pic.jabar@mobi.com",
      role: "ADMIN",
      level: UserLevel.PIC,
      scope: UserScope.REGION,
      regionName: "JABAR",
    },
    {
      name: "Admin PO",
      email: "admin.po@mobi.com",
      role: "ADMIN",
      level: UserLevel.PO,
      scope: UserScope.ALL,
      regionName: "STARLIGHT",
    },
    {
      name: "Supervisor PIC Jabar",
      email: "supervisor.pic.jabar@mobi.com",
      role: "SUPERVISOR",
      level: UserLevel.PIC,
      scope: UserScope.REGION,
      regionName: "JABAR",
    },
    {
      name: "Supervisor PO",
      email: "supervisor.po@mobi.com",
      role: "SUPERVISOR",
      level: UserLevel.PO,
      scope: UserScope.ALL,
      regionName: "STARLIGHT",
    },
    {
      name: "Permitter Jabar",
      email: "permitter.jabar@mobi.com",
      role: "PERMITTER",
      level: UserLevel.PERMITTER,
      scope: UserScope.REGION,
      regionName: "JABAR",
    },
    {
      name: "SPG Jabar",
      email: "spg.jabar@mobi.com",
      role: "SPG",
      level: UserLevel.SPG,
      scope: UserScope.REGION,
      regionName: "JABAR",
    },
    {
      name: "Team Leader Jabar",
      email: "tl.jabar@mobi.com",
      role: "SPG",
      level: UserLevel.TEAM_LEADER,
      scope: UserScope.REGION,
      regionName: "JABAR",
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
        level: user.level,
        scope: user.scope,
        regionId: regionRecords[user.regionName].id,
      },
      create: {
        name: user.name,
        email: user.email,
        password: passwordHash,
        role: user.role,
        level: user.level,
        scope: user.scope,
        regionId: regionRecords[user.regionName].id,
      },
    });
  }

  console.log("✅ Users seeded");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
