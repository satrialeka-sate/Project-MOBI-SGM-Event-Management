import "dotenv/config";
import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // 1. Check PostgreSQL enum values
  const enumResult = await pool.query("SELECT enum_range(null::user_role)");
  console.log("PostgreSQL enum user_role values:", enumResult.rows[0].enum_range);

  // 2. Check users
  const users = await prisma.user.findMany({
    take: 20,
    select: { email: true, role: true, level: true, scope: true, regionId: true },
  });
  console.log("\nUsers in database:");
  users.forEach((u) => console.log("  " + u.email + " -> role=" + u.role + ", level=" + u.level + ", scope=" + u.scope));

  // 3. Check column default
  const colResult = await pool.query(
    "SELECT column_default, udt_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role'"
  );
  console.log("\nColumn default for role:", JSON.stringify(colResult.rows[0]));

  // 4. Check for any triggers
  const triggers = await pool.query(
    "SELECT trigger_name, event_manipulation FROM information_schema.triggers WHERE event_object_table = 'users'"
  );
  console.log("\nTriggers on users table:", triggers.rows.length > 0 ? JSON.stringify(triggers.rows) : "None");

  // 5. Try to create a test user with role ADMIN and see what happens
  console.log("\n--- Testing Prisma create with explicit role ---");
  try {
    const testUser = await prisma.user.create({
      data: {
        email: "test-debug-" + Date.now() + "@example.com",
        name: "Test Debug",
        password: "test",
        role: "ADMIN" as any,
        level: "SPG" as any,
        scope: "REGION" as any,
        regionId: users[0]?.regionId || "none",
      },
      select: { email: true, role: true, level: true, scope: true, regionId: true },
    });
    console.log("Created test user:", JSON.stringify(testUser));
    
    // Clean up
    await prisma.user.delete({ where: { email: testUser.email } });
    console.log("Test user deleted successfully");
  } catch (e: any) {
    console.error("Test create failed:", e.message);
  }

  // 6. Try upsert with explicit role
  console.log("\n--- Testing Prisma upsert with explicit role ---");
  try {
    const testEmail = "test-upsert-" + Date.now() + "@example.com";
    const upsertedUser = await prisma.user.upsert({
      where: { email: testEmail },
      update: { name: "Updated" },
      create: {
        email: testEmail,
        name: "Test Upsert",
        password: "test",
        role: "SUPERVISOR" as any,
        level: "TEAM_LEADER" as any,
        scope: "ALL" as any,
        regionId: users[0]?.regionId || "none",
      },
      select: { email: true, role: true, level: true, scope: true, regionId: true },
    });
    console.log("Upserted user:", JSON.stringify(upsertedUser));
    await prisma.user.delete({ where: { email: upsertedUser.email } });
    console.log("Test upsert user deleted");
  } catch (e: any) {
    console.error("Test upsert failed:", e.message);
  }

  await prisma.$disconnect();
  await pool.end();
}

main().catch(console.error);
