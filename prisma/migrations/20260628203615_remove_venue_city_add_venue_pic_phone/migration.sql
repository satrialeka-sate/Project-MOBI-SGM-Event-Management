/*
  Warnings:

  - You are about to drop the column `venueCity` on the `permitters` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "permitters" DROP CONSTRAINT "permitters_spgId_fkey";

-- DropIndex
DROP INDEX "permitters_spgId_eventDate_key";

-- AlterTable
ALTER TABLE "permitters" DROP COLUMN "venueCity",
ADD COLUMN     "venuePICPhone" TEXT NOT NULL DEFAULT '',
ALTER COLUMN "spgId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "permitters" ADD CONSTRAINT "permitters_spgId_fkey" FOREIGN KEY ("spgId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
