import { PrismaClient, UserLevel, UserRole, UserScope } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcrypt";

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

  // ── Default password (hashed) ──────────────────────────────────────────
  const DEFAULT_PASSWORD = await bcrypt.hash("12345678", 12);

  // ── Users ──────────────────────────────────────────────────────────────
  // Users can authenticate via:
  //   - Email/Username + Password
  //   - Google OAuth (email must match)
  // Each user has a unique username and a bcrypt-hashed default password.
const users = [
  // =========================
  // STARLIGHT
  // =========================
  {
    name: "Gerry",
    username: "garry",
    email: "garry.tumiwa@gmail.com",
    role: UserRole.SUPERVISOR,
    level: UserLevel.PO,
    scope: UserScope.ALL,
    regionName: "STARLIGHT",
  },
  {
    name: "Ali",
    username: "ali",
    email: "alijoufri@gmail.com",
    role: UserRole.ADMIN,
    level: UserLevel.PO,
    scope: UserScope.ALL,
    regionName: "STARLIGHT",
  },
  {
    name: "Erik",
    username: "erik",
    email: "pargaulan182@gmail.com",
    role: UserRole.ADMIN,
    level: UserLevel.PIC,
    scope: UserScope.REGION,
    regionName: "STARLIGHT",
  },
  {
    name: "Rahmi",
    username: "rahmi",
    email: "rna.rahmi@gmail.com",
    role: UserRole.ADMIN,
    level: UserLevel.PIC,
    scope: UserScope.REGION,
    regionName: "STARLIGHT",
  },
  {
    name: "Momentum",
    username: "momentum",
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
    username: "rizkiamalia",
    email: "rizkiamaliaji91@gmail.com",
    role: UserRole.ADMIN,
    level: UserLevel.PIC,
    scope: UserScope.REGION,
    regionName: "JABAR",
  },
  {
    name: "Arjuna",
    username: "arjuna",
    email: "arjuna28alnurjati@gmail.com",
    role: UserRole.PERMITTER,
    level: UserLevel.PERMITTER,
    scope: UserScope.REGION,
    regionName: "JABAR",
  },
  {
    name: "Yuni",
    username: "yuni",
    email: "amaliajyuni@gmail.com",
    role: UserRole.SUPERVISOR,
    level: UserLevel.SPG,
    scope: UserScope.REGION,
    regionName: "JABAR",
  },
  {
    name: "Hana",
    username: "hana",
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
    username: "akbar",
    email: "akbarsugiyarto88@gmail.com",
    role: UserRole.ADMIN,
    level: UserLevel.PIC,
    scope: UserScope.REGION,
    regionName: "JATENG",
  },
  {
    name: "Reksa",
    username: "reksa",
    email: "reksajayabaru@gmail.com",
    role: UserRole.PERMITTER,
    level: UserLevel.PERMITTER,
    scope: UserScope.REGION,
    regionName: "JATENG",
  },
  {
    name: "Dinda",
    username: "dinda",
    email: "dindateratu372@gmail.com",
    role: UserRole.SUPERVISOR,
    level: UserLevel.SPG,
    scope: UserScope.REGION,
    regionName: "JATENG",
  },
  {
    name: "Risqy",
    username: "risqy",
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
    username: "anteam",
    email: "info.anteam0523@gmail.com",
    role: UserRole.ADMIN,
    level: UserLevel.PIC,
    scope: UserScope.REGION,
    regionName: "JATIM",
  },
  {
    name: "Genok",
    username: "genok",
    email: "genoknugrah@gmail.com",
    role: UserRole.PERMITTER,
    level: UserLevel.PERMITTER,
    scope: UserScope.REGION,
    regionName: "JATIM",
  },
  {
    name: "Kojin",
    username: "kojin",
    email: "kojin.insight.mlg@gmail.com",
    role: UserRole.SUPERVISOR,
    level: UserLevel.SPG,
    scope: UserScope.REGION,
    regionName: "JATIM",
  },
  {
    name: "Jatim Squad",
    username: "jatimsquad",
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
    username: "dodi",
    email: "dody83setiawan@gmail.com",
    role: UserRole.ADMIN,
    level: UserLevel.PO,
    scope: UserScope.ALL,
    regionName: "STARLIGHT",
  },
  {
    name: "Defanie",
    username: "defanie",
    email: "defanie@gmail.com",
    role: UserRole.ADMIN,
    level: UserLevel.PO,
    scope: UserScope.ALL,
    regionName: "STARLIGHT",
  },
  {
    name: "Adelia",
    username: "adelia",
    email: "adelia.maysarahman@danone.com",
    role: UserRole.ADMIN,
    level: UserLevel.PO,
    scope: UserScope.ALL,
    regionName: "STARLIGHT",
  },
  {
    name: "Febri",
    username: "febri",
    email: "febri.sianturi@danone.com",
    role: UserRole.ADMIN,
    level: UserLevel.PO,
    scope: UserScope.ALL,
    regionName: "STARLIGHT",
  },
  {
    name: "Sarah",
    username: "sarah",
    email: "sarah.mahardhika@danone.com",
    role: UserRole.ADMIN,
    level: UserLevel.PO,
    scope: UserScope.ALL,
    regionName: "STARLIGHT",
  },
  {
    name: "Tri",
    username: "tri",
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
    username: "ainal",
    email: "aliqahoney@gmail.com",
    role: UserRole.ADMIN,
    level: UserLevel.PO,
    scope: UserScope.ALL,
    regionName: "STARLIGHT",
  },
  {
    name: "Kusnadi",
    username: "kusnadi",
    email: "starlight.aplikasi@gmail.com",
    role: UserRole.ADMIN,
    level: UserLevel.PO,
    scope: UserScope.ALL,
    regionName: "STARLIGHT",
  },
  {
    name: "Satria",
    username: "satria",
    email: "satria.aleka@gmail.com",
    role: UserRole.ADMIN,
    level: UserLevel.PO,
    scope: UserScope.ALL,
    regionName: "STARLIGHT",
  },
];

  // ── DEVELOPMENT TEST USERS ─────────────────────────────────────────────
  // These users are for testing purposes only and don't interfere with
  // production users. All use password: 12345678
  const testUsers = [
    // ── ADMIN PO ─────────────────────────────────────────────────────────
    {
      name: "Admin PO",
      username: "adminpo",
      email: "admin.po@test.com",
      role: UserRole.ADMIN,
      level: UserLevel.PO,
      scope: UserScope.ALL,
      regionName: "STARLIGHT",
    },

    // ── ADMIN PIC ────────────────────────────────────────────────────────
    {
      name: "Admin PIC Jabar",
      username: "adminpicjabar",
      email: "admin.pic.jabar@test.com",
      role: UserRole.ADMIN,
      level: UserLevel.PIC,
      scope: UserScope.REGION,
      regionName: "JABAR",
    },
    {
      name: "Admin PIC Jateng",
      username: "adminpicjateng",
      email: "admin.pic.jateng@test.com",
      role: UserRole.ADMIN,
      level: UserLevel.PIC,
      scope: UserScope.REGION,
      regionName: "JATENG",
    },
    {
      name: "Admin PIC Jatim",
      username: "adminpicjatim",
      email: "admin.pic.jatim@test.com",
      role: UserRole.ADMIN,
      level: UserLevel.PIC,
      scope: UserScope.REGION,
      regionName: "JATIM",
    },

    // ── SUPERVISOR ────────────────────────────────────────────────────────
    {
      name: "Supervisor PO",
      username: "supervisorpo",
      email: "supervisor.po@test.com",
      role: UserRole.SUPERVISOR,
      level: UserLevel.PO,
      scope: UserScope.ALL,
      regionName: "STARLIGHT",
    },
    {
      name: "Supervisor Jabar",
      username: "supervisorjabar",
      email: "supervisor.jabar@test.com",
      role: UserRole.SUPERVISOR,
      level: UserLevel.SPG,
      scope: UserScope.REGION,
      regionName: "JABAR",
    },
    {
      name: "Supervisor Jateng",
      username: "supervisorjateng",
      email: "supervisor.jateng@test.com",
      role: UserRole.SUPERVISOR,
      level: UserLevel.SPG,
      scope: UserScope.REGION,
      regionName: "JATENG",
    },
    {
      name: "Supervisor Jatim",
      username: "supervisorjatim",
      email: "supervisor.jatim@test.com",
      role: UserRole.SUPERVISOR,
      level: UserLevel.SPG,
      scope: UserScope.REGION,
      regionName: "JATIM",
    },

    // ── PERMITTER ────────────────────────────────────────────────────────
    {
      name: "Permitter Jabar",
      username: "permitterjabar",
      email: "permitter.jabar@test.com",
      role: UserRole.PERMITTER,
      level: UserLevel.PERMITTER,
      scope: UserScope.REGION,
      regionName: "JABAR",
    },
    {
      name: "Permitter Jateng",
      username: "permitterjateng",
      email: "permitter.jateng@test.com",
      role: UserRole.PERMITTER,
      level: UserLevel.PERMITTER,
      scope: UserScope.REGION,
      regionName: "JATENG",
    },
    {
      name: "Permitter Jatim",
      username: "permitterjatim",
      email: "permitter.jatim@test.com",
      role: UserRole.PERMITTER,
      level: UserLevel.PERMITTER,
      scope: UserScope.REGION,
      regionName: "JATIM",
    },

    // ── TEAM LEADER ──────────────────────────────────────────────────────
    {
      name: "Team Leader Jabar",
      username: "tljabar",
      email: "tl.jabar@test.com",
      role: UserRole.SPG,
      level: UserLevel.TEAM_LEADER,
      scope: UserScope.REGION,
      regionName: "JABAR",
    },
    {
      name: "Team Leader Jateng",
      username: "tljateng",
      email: "tl.jateng@test.com",
      role: UserRole.SPG,
      level: UserLevel.TEAM_LEADER,
      scope: UserScope.REGION,
      regionName: "JATENG",
    },
    {
      name: "Team Leader Jatim",
      username: "tljatim",
      email: "tl.jatim@test.com",
      role: UserRole.SPG,
      level: UserLevel.TEAM_LEADER,
      scope: UserScope.REGION,
      regionName: "JATIM",
    },

    // ── SPG ──────────────────────────────────────────────────────────────
    {
      name: "SPG Jabar",
      username: "spgjabar",
      email: "spg.jabar@test.com",
      role: UserRole.SPG,
      level: UserLevel.SPG,
      scope: UserScope.REGION,
      regionName: "JABAR",
    },
    {
      name: "SPG Jateng",
      username: "spgjateng",
      email: "spg.jateng@test.com",
      role: UserRole.SPG,
      level: UserLevel.SPG,
      scope: UserScope.REGION,
      regionName: "JATENG",
    },
    {
      name: "SPG Jatim",
      username: "spgjatim",
      email: "spg.jatim@test.com",
      role: UserRole.SPG,
      level: UserLevel.SPG,
      scope: UserScope.REGION,
      regionName: "JATIM",
    },
  ];

  for (const user of [...users, ...testUsers]) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        username: user.username,
        password: DEFAULT_PASSWORD,
        role: user.role,
        level: user.level,
        scope: user.scope,
        regionId: regionRecords[user.regionName].id,
        isActive: true,
      },
      create: {
        name: user.name,
        email: user.email,
        username: user.username,
        password: DEFAULT_PASSWORD,
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
