-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('ADMIN', 'SUPERVISOR', 'PERMITTER', 'SPG');

-- AlterTable: change role column from TEXT to ENUM
ALTER TABLE "users"
  ALTER COLUMN "role" DROP DEFAULT,
  ALTER COLUMN "role" TYPE "user_role" USING "role"::text::"user_role",
  ALTER COLUMN "role" SET DEFAULT 'PERMITTER';
