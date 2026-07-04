import { PrismaClient, UserLevel, UserRole, UserScope } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
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
  // Users are created without passwords — authentication is via Google OAuth only.
  // Each user's email must match their Google account email.
const users = [
  // =========================
  // STARLIGHT
  // =========================
  {
    name: "Gerry",
    email: "garry.tumiwa@gmail.com",
    role: UserRole.SUPERVISOR,
    level: UserLevel.PO,
    scope: UserScope.ALL,
    regionName: "STARLIGHT",
  },
  {
    name: "Ali",
    email: "alijoufri@gmail.com",
    role: UserRole.ADMIN,
    level: UserLevel.PO,
    scope: UserScope.ALL,
    regionName: "STARLIGHT",
  },
  {
    name: "Erik",
    email: "pargaulan182@gmail.com",
    role: UserRole.ADMIN,
    level: UserLevel.PIC,
    scope: UserScope.REGION,
    regionName: "STARLIGHT",
  },
  {
    name: "Rahmi",
    email: "rna.rahmi@gmail.com",
    role: UserRole.ADMIN,
    level: UserLevel.PIC,
    scope: UserScope.REGION,
    regionName: "STARLIGHT",
  },
  {
    name: "Momentum",
    email: "momentum.eo.event@gmail.com",
    role: UserRole.ADMIN,
    level: UserLevel.PIC,
    scope: UserScope.REGION,
    regionName: "STARLIGHT",
  },

  // =========================
  // JABAR
  // =========================
  {
    name: "Rizkiamalia",
    email: "rizkiamaliaji91@gmail.com",
    role: UserRole.ADMIN,
    level: UserLevel.PIC,
    scope: UserScope.REGION,
    regionName: "JABAR",
  },
  {
    name: "Arjuna",
    email: "arjuna28alnurjati@gmail.com",
    role: UserRole.PERMITTER,
    level: UserLevel.PERMITTER,
    scope: UserScope.REGION,
    regionName: "JABAR",
  },
  {
    name: "Yuni",
    email: "amaliajyuni@gmail.com",
    role: UserRole.SUPERVISOR,
    level: UserLevel.SPG,
    scope: UserScope.REGION,
    regionName: "JABAR",
  },
  {
    name: "Hana",
    email: "chatlenhana@gmail.com",
    role: UserRole.SPG,
    level: UserLevel.SPG,
    scope: UserScope.REGION,
    regionName: "JABAR",
  },

  // =========================
  // JATENG
  // =========================
  {
    name: "Akbar",
    email: "akbarsugiyarto88@gmail.com",
    role: UserRole.ADMIN,
    level: UserLevel.PIC,
    scope: UserScope.REGION,
    regionName: "JATENG",
  },
  {
    name: "Reksa",
    email: "reksajayabaru@gmail.com",
    role: UserRole.PERMITTER,
    level: UserLevel.PERMITTER,
    scope: UserScope.REGION,
    regionName: "JATENG",
  },
  {
    name: "Dinda",
    email: "dindateratu372@gmail.com",
    role: UserRole.SUPERVISOR,
    level: UserLevel.SPG,
    scope: UserScope.REGION,
    regionName: "JATENG",
  },
  {
    name: "Risqy",
    email: "risqygemini@gmail.com",
    role: UserRole.SPG,
    level: UserLevel.SPG,
    scope: UserScope.REGION,
    regionName: "JATENG",
  },

  // =========================
  // JATIM
  // =========================
  {
    name: "Anteam",
    email: "info.anteam0523@gmail.com",
    role: UserRole.ADMIN,
    level: UserLevel.PIC,
    scope: UserScope.REGION,
    regionName: "JATIM",
  },
  {
    name: "Genok",
    email: "genoknugrah@gmail.com",
    role: UserRole.PERMITTER,
    level: UserLevel.PERMITTER,
    scope: UserScope.REGION,
    regionName: "JATIM",
  },
  {
    name: "Kojin",
    email: "kojin.insight.mlg@gmail.com",
    role: UserRole.SUPERVISOR,
    level: UserLevel.SPG,
    scope: UserScope.REGION,
    regionName: "JATIM",
  },
  {
    name: "Jatim Squad",
    email: "jatimsquad1@gmail.com",
    role: UserRole.SPG,
    level: UserLevel.SPG,
    scope: UserScope.REGION,
    regionName: "JATIM",
  },

  // =========================
  // CLIENT
  // =========================
  {
    name: "Dodi",
    email: "dody83setiawan@gmail.com",
    role: UserRole.ADMIN,
    level: UserLevel.PO,
    scope: UserScope.ALL,
    regionName: "STARLIGHT",
  },
  {
    name: "Defanie",
    email: "defanie@gmail.com",
    role: UserRole.ADMIN,
    level: UserLevel.PO,
    scope: UserScope.ALL,
    regionName: "STARLIGHT",
  },
  {
    name: "Adelia",
    email: "adelia.maysarahman@danone.com",
    role: UserRole.ADMIN,
    level: UserLevel.PO,
    scope: UserScope.ALL,
    regionName: "STARLIGHT",
  },
  {
    name: "Febri",
    email: "febri.sianturi@danone.com",
    role: UserRole.ADMIN,
    level: UserLevel.PO,
    scope: UserScope.ALL,
    regionName: "STARLIGHT",
  },
  {
    name: "Sarah",
    email: "sarah.mahardhika@danone.com",
    role: UserRole.ADMIN,
    level: UserLevel.PO,
    scope: UserScope.ALL,
    regionName: "STARLIGHT",
  },
  {
    name: "Tri",
    email: "tri.nugrahaningrum@danone.com",
    role: UserRole.ADMIN,
    level: UserLevel.PO,
    scope: UserScope.ALL,
    regionName: "STARLIGHT",
  },

  // =========================
  // APLIKATOR
  // =========================
  {
    name: "Ainal",
    email: "aliqahoney@gmail.com",
    role: UserRole.ADMIN,
    level: UserLevel.PO,
    scope: UserScope.ALL,
    regionName: "STARLIGHT",
  },
  {
    name: "Kusnadi",
    email: "starlight.aplikasi@gmail.com",
    role: UserRole.ADMIN,
    level: UserLevel.PO,
    scope: UserScope.ALL,
    regionName: "STARLIGHT",
  },
  {
    name: "Satria",
    email: "satria.aleka@gmail.com",
    role: UserRole.ADMIN,
    level: UserLevel.PO,
    scope: UserScope.ALL,
    regionName: "STARLIGHT",
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
