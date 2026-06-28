import { PrismaClient } from "@prisma/client";
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
  const users = [
    {
      name: "Admin Starlight",
      email: "admin@starlight.com",
      role: "ADMIN",
      regionName: "STARLIGHT",
    },
    {
      name: "Permitter Jabar",
      email: "permitter.jabar@mobi.com",
      role: "PERMITTER",
      regionName: "JABAR",
    },
    {
      name: "Permitter Jatim",
      email: "permitter.jatim@mobi.com",
      role: "PERMITTER",
      regionName: "JATIM",
    },
    {
      name: "Permitter Jateng",
      email: "permitter.jateng@mobi.com",
      role: "PERMITTER",
      regionName: "JATENG",
    },
    {
      name: "SPG Jabar",
      email: "spg.jabar@mobi.com",
      role: "SPG",
      regionName: "JABAR",
    },
    {
      name: "SPG Jatim",
      email: "spg.jatim@mobi.com",
      role: "SPG",
      regionName: "JATIM",
    },
    {
      name: "SPG Jateng",
      email: "spg.jateng@mobi.com",
      role: "SPG",
      regionName: "JATENG",
    },
    {
      name: "Supervisor",
      email: "supervisor@starlight.com",
      role: "SUPERVISOR",
      regionName: "STARLIGHT",
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
        regionId: regionRecords[user.regionName].id,
      },
      create: {
        name: user.name,
        email: user.email,
        password: passwordHash,
        role: user.role,
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
