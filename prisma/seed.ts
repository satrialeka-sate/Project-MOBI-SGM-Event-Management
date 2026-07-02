import { PrismaClient, UserLevel, UserRole, UserScope } from "@prisma/client";
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

  // ── Master Products ─────────────────────────────────────────────────────
 const products = [
  {
    productName: "SGM 1+ 150gr MADU",
    price: 15800,
    package: "PAKET 1",
    gimmick: "Sticker",
  },
  {
    productName: "SGM 1+ 150gr VANILLA",
    price: 15800,
    package: "PAKET 1",
    gimmick: "Sticker",
  },
  {
    productName: "SGM 1+ 400gr MADU",
    price: 41800,
    package: "PAKET 2",
    gimmick: "Pensil warna",
  },
  {
    productName: "SGM 1+ 400gr VANILLA",
    price: 41800,
    package: "PAKET 2",
    gimmick: "Pensil warna",
  },
  {
    productName: "SGM 1+ 900gr MADU",
    price: 71400,
    package: "PAKET 3",
    gimmick: "Tas",
  },
  {
    productName: "SGM 1+ 900gr VANILLA",
    price: 71400,
    package: "PAKET 3",
    gimmick: "Tas",
  },
  {
    productName: "SGM 3+ 150gr MADU",
    price: 15800,
    package: "PAKET 1",
    gimmick: "Sticker",
  },
  {
    productName: "SGM 3+ 400gr MADU",
    price: 41800,
    package: "PAKET 2",
    gimmick: "Pensil warna",
  },
  {
    productName: "SGM 3+ 400gr VANILLA",
    price: 41800,
    package: "PAKET 2",
    gimmick: "Pensil warna",
  },
  {
    productName: "SGM 3+ 400gr COKLAT",
    price: 41800,
    package: "PAKET 2",
    gimmick: "Pensil warna",
  },
  {
    productName: "SGM 3+ 900gr MADU",
    price: 76200,
    package: "PAKET 3",
    gimmick: "Tas",
  },
  {
    productName: "SGM 3+ 900gr VANILLA",
    price: 76200,
    package: "PAKET 3",
    gimmick: "Tas",
  },
  {
    productName: "SGM 3+ 900gr COKLAT",
    price: 76200,
    package: "PAKET 3",
    gimmick: "Tas",
  },
  {
    productName: "SGM 5+ 400gr MADU",
    price: 35600,
    package: "PAKET 2",
    gimmick: "Pensil warna",
  },
  {
    productName: "SGM 5+ 900gr MADU",
    price: 71400,
    package: "PAKET 3",
    gimmick: "Tas",
  },
  {
    productName: "SGM 5+ 900gr COKLAT",
    price: 71400,
    package: "PAKET 3",
    gimmick: "Tas",
  },
];

  for (const product of products) {
    await prisma.masterProduct.upsert({
      where: { productName: product.productName },
      update: {
        price: product.price,
        package: product.package,
        gimmick: product.gimmick,
      },
      create: {
        productName: product.productName,
        price: product.price,
        package: product.package,
        gimmick: product.gimmick,
      },
    });
  }

  console.log("✅ Master Products seeded");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
