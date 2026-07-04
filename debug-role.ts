import "dotenv/config";
import { PrismaClient, UserRole, UserLevel, UserScope } from "@prisma/client";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });

async function main() {
  // 1. Print Prisma-generated enum values
  console.log("Prisma UserRole enum values:");
  console.log("  UserRole.ADMIN      =", UserRole.ADMIN);
  console.log("  UserRole.SUPERVISOR =", UserRole.SUPERVISOR);
  console.log("  UserRole.PERMITTER  =", UserRole.PERMITTER);
  console.log("  UserRole.SPG        =", UserRole.SPG);

  // 2. Check if there's a region to use
  const regions = await pool.query("SELECT id, name FROM public.regions LIMIT 1");
  if (regions.rows.length === 0) {
    console.log("No regions found, creating one...");
    await pool.query("INSERT INTO public.regions (id, name, \"createdAt\", \"updatedAt\") VALUES ('test-region', 'Test Region', NOW(), NOW())");
  }
  const regionId = regions.rows[0]?.id || "test-region";
  console.log("Using region:", regionId);

  // 3. Test creation with different PrismaClient methods
  const prisma = new PrismaClient();

  // Test 1: Direct PrismaClient create with UserRole.ADMIN
  console.log("\n=== Test 1: prisma.user.create with UserRole.ADMIN ===");
  const test1 = await prisma.user.create({
    data: {
      email: "test1-admin-" + Date.now() + "@test.com",
      name: "Test Admin",
      password: "test",
      role: UserRole.ADMIN,
      level: UserLevel.PO,
      scope: UserScope.ALL,
      regionId: regionId,
    },
    select: { email: true, role: true, level: true, scope: true },
  });
  console.log("  Result:", JSON.stringify(test1));

  // Test 2: Upsert with UserRole.SUPERVISOR
  console.log("\n=== Test 2: prisma.user.upsert with UserRole.SUPERVISOR ===");
  const testEmail = "test2-supervisor-" + Date.now() + "@test.com";
  const test2 = await prisma.user.upsert({
    where: { email: testEmail },
    update: {},
    create: {
      email: testEmail,
      name: "Test Supervisor",
      password: "test",
      role: UserRole.SUPERVISOR,
      level: UserLevel.SPG,
      scope: UserScope.REGION,
      regionId: regionId,
    },
    select: { email: true, role: true, level: true, scope: true },
  });
  console.log("  Result:", JSON.stringify(test2));

  // Test 3: Create with string literal
  console.log("\n=== Test 3: prisma.user.create with string 'SPG' ===");
  const test3 = await prisma.user.create({
    data: {
      email: "test3-spg-" + Date.now() + "@test.com",
      name: "Test SPG",
      password: "test",
      role: "SPG" as any,
      level: "SPG" as any,
      scope: "REGION" as any,
      regionId: regionId,
    },
    select: { email: true, role: true, level: true, scope: true },
  });
  console.log("  Result:", JSON.stringify(test3));

  // Test 4: Check if the adapter is affecting things by creating directly via SQL
  console.log("\n=== Test 4: Direct SQL INSERT ===");
  const sqlEmail = "test4-direct-" + Date.now() + "@test.com";
  await pool.query(
    'INSERT INTO public.users (id, email, name, password, role, level, scope, "regionId", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5::user_role, $6::user_level, $7::user_scope, $8, NOW(), NOW())',
    ["test-id-" + Date.now(), sqlEmail, "Test Direct SQL", "test", "ADMIN", "PO", "ALL", regionId]
  );
  const sqlResult = await pool.query("SELECT email, role::text, level::text, scope::text FROM public.users WHERE email = $1", [sqlEmail]);
  console.log("  SQL result:", JSON.stringify(sqlResult.rows[0]));

  // Cleanup test users
  console.log("\n=== Cleanup ===");
  for (const email of [test1.email, test2.email, test3.email, sqlEmail]) {
    await prisma.user.delete({ where: { email } }).catch(() => {});
    console.log("  Deleted:", email);
  }

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => { console.error("Error:", e); process.exit(1); });
