/**
 * INVESTIGASI ROLE BUG
 *
 * Membuat user dengan role=ADMIN via 4 metode berbeda,
 * lalu mengecek apa yang benar-benar tersimpan di database.
 */

import "dotenv/config";
import { PrismaClient, UserRole, UserLevel, UserScope } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

async function main() {
  const POOL = new Pool({ connectionString: process.env.DATABASE_URL! });

  async function getFirstRegionId(): Promise<string> {
    const result = await POOL.query("SELECT id FROM regions LIMIT 1");
    if (result.rows.length > 0) return result.rows[0].id;
    const newRegion = await POOL.query(
      "INSERT INTO regions (id, name, \"createdAt\", \"updatedAt\") VALUES ($1, $2, NOW(), NOW()) RETURNING id",
      ["test-region-" + Date.now(), "Test Region"]
    );
    return newRegion.rows[0].id;
  }

  async function checkInDb(email: string, label: string) {
    const result = await POOL.query(
      "SELECT email, role::text as role, level::text as level, scope::text as scope FROM users WHERE email = $1",
      [email]
    );
    if (result.rows.length > 0) {
      const row = result.rows[0];
      const status = row.role === "ADMIN" ? "OK" : "SALAH";
      console.log("  [" + status + "] [" + label + "] role=" + row.role + " (expected ADMIN) level=" + row.level + " scope=" + row.scope);
    }
    return result.rows[0];
  }

  const UNIQUE_SUFFIX = Date.now();
  const REGION_ID = await getFirstRegionId();

  console.log("=".repeat(70));
  console.log("INVESTIGASI: Apakah role benar-benar dikirim ke database?");
  console.log("=".repeat(70));
  console.log("Region ID:", REGION_ID);
  console.log("Suffix:", UNIQUE_SUFFIX);
  console.log("UserRole.ADMIN value =", JSON.stringify(UserRole.ADMIN));
  console.log();

  // ============================================================
  // TEST 1: Plain PrismaClient.create
  // ============================================================
  console.log("--- TEST 1: Plain PrismaClient.create() ---");
  try {
    const prisma = new PrismaClient();
    const email = "test1-plain-" + UNIQUE_SUFFIX + "@test.com";
    console.log("Creating:", email);
    const user = await prisma.user.create({
      data: {
        email, name: "Test Plain", password: "test",
        role: "ADMIN" as any,
        level: "PO" as any, scope: "ALL" as any,
        regionId: REGION_ID,
      },
      select: { email: true, role: true, level: true, scope: true },
    });
    console.log("  Prisma return:", JSON.stringify(user));
    await checkInDb(email, "PLAIN CREATE");
    await prisma.$disconnect();
  } catch (e: any) {
    console.log("  ERROR:", e.message);
  }
  console.log();

  // ============================================================
  // TEST 2: Adapter PrismaClient.create
  // ============================================================
  console.log("--- TEST 2: PrismaClient + @prisma/adapter-pg ---");
  try {
    const adapter = new PrismaPg(POOL);
    const prisma = new PrismaClient({ adapter });
    const email = "test2-adapter-" + UNIQUE_SUFFIX + "@test.com";
    console.log("Creating:", email);
    const user = await prisma.user.create({
      data: {
        email, name: "Test Adapter", password: "test",
        role: "ADMIN" as any,
        level: "PO" as any, scope: "ALL" as any,
        regionId: REGION_ID,
      },
      select: { email: true, role: true, level: true, scope: true },
    });
    console.log("  Prisma return:", JSON.stringify(user));
    await checkInDb(email, "ADAPTER CREATE");
    await prisma.$disconnect();
  } catch (e: any) {
    console.log("  ERROR:", e.message);
  }
  console.log();

  // ============================================================
  // TEST 3: UPSERT via Plain
  // ============================================================
  console.log("--- TEST 3: Upsert via Plain PrismaClient ---");
  try {
    const prisma = new PrismaClient();
    const email = "test3-upsert-" + UNIQUE_SUFFIX + "@test.com";
    console.log("Upserting:", email);
    const user = await prisma.user.upsert({
      where: { email },
      update: { name: "Updated" },
      create: {
        email, name: "Test Upsert", password: "test",
        role: UserRole.ADMIN,
        level: UserLevel.PO, scope: UserScope.ALL,
        regionId: REGION_ID,
      },
      select: { email: true, role: true, level: true, scope: true },
    });
    console.log("  Prisma return:", JSON.stringify(user));
    console.log("  Upsert action:", user.email, "- checking DB...");
    await checkInDb(email, "UPSERT ENUM");
    await prisma.$disconnect();
  } catch (e: any) {
    console.log("  ERROR:", e.message);
  }
  console.log();

  // ============================================================
  // TEST 4: RAW SQL
  // ============================================================
  console.log("--- TEST 4: Direct RAW SQL (bypass Prisma) ---");
  try {
    const email = "test4-raw-" + UNIQUE_SUFFIX + "@test.com";
    console.log("Creating:", email);
    const result = await POOL.query(
      "INSERT INTO users (id, email, name, password, role, level, scope, \"regionId\", \"createdAt\", \"updatedAt\") VALUES ($1, $2, $3, $4, $5::user_role, $6::user_level, $7::user_scope, $8, NOW(), NOW()) RETURNING id, email, role::text as role, level::text as level, scope::text as scope",
      [crypto.randomUUID(), email, "Test Raw", "test", "ADMIN", "PO", "ALL", REGION_ID]
    );
    console.log("  SQL return:", JSON.stringify(result.rows[0]));
    await checkInDb(email, "RAW SQL");
  } catch (e: any) {
    console.log("  ERROR:", e.message);
  }
  console.log();

  // CLEANUP
  console.log("--- CLEANUP ---");
  const emails = [
    "test1-plain-" + UNIQUE_SUFFIX + "@test.com",
    "test2-adapter-" + UNIQUE_SUFFIX + "@test.com",
    "test3-upsert-" + UNIQUE_SUFFIX + "@test.com",
    "test4-raw-" + UNIQUE_SUFFIX + "@test.com",
  ];
  for (const email of emails) {
    await POOL.query("DELETE FROM users WHERE email = $1", [email]);
    console.log("  Deleted:", email);
  }

  await POOL.end();
  console.log("\nSelesai.");
}

main().catch(function(e) { console.error("FATAL:", e); process.exit(1); });
