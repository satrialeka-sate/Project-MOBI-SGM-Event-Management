-- CreateEnum
CREATE TYPE "user_level" AS ENUM ('PERMITTER', 'SPG', 'TEAM_LEADER', 'PIC', 'PO');

-- CreateEnum
CREATE TYPE "user_scope" AS ENUM ('REGION', 'ALL');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "level" "user_level" NOT NULL DEFAULT 'PERMITTER',
ADD COLUMN     "scope" "user_scope" NOT NULL DEFAULT 'REGION',
ALTER COLUMN "role" SET DEFAULT 'PERMITTER';
