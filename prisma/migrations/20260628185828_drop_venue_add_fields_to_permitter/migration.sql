/*
  Warnings:

  - You are about to drop the column `venueId` on the `permitters` table. All the data in the column will be lost.
  - You are about to drop the `venues` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `cycle` to the `permitters` table without a default value. This is not possible if the table is not empty.
  - Added the required column `regionId` to the `permitters` table without a default value. This is not possible if the table is not empty.
  - Added the required column `venueAddress` to the `permitters` table without a default value. This is not possible if the table is not empty.
  - Added the required column `venueCity` to the `permitters` table without a default value. This is not possible if the table is not empty.
  - Added the required column `venueName` to the `permitters` table without a default value. This is not possible if the table is not empty.
  - Added the required column `venuePIC` to the `permitters` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "permitters" DROP CONSTRAINT "permitters_venueId_fkey";

-- DropForeignKey
ALTER TABLE "venues" DROP CONSTRAINT "venues_regionId_fkey";

-- DropIndex
DROP INDEX "permitters_venueId_eventDate_key";

-- AlterTable
ALTER TABLE "permitter_schools" ALTER COLUMN "schoolAddress" DROP DEFAULT,
ALTER COLUMN "totalStudents" DROP DEFAULT,
ALTER COLUMN "picName" DROP DEFAULT,
ALTER COLUMN "picPhone" DROP DEFAULT;

-- AlterTable
ALTER TABLE "permitters" DROP COLUMN "venueId",
ADD COLUMN     "cycle" TEXT NOT NULL,
ADD COLUMN     "regionId" TEXT NOT NULL,
ADD COLUMN     "venueAddress" TEXT NOT NULL,
ADD COLUMN     "venueCity" TEXT NOT NULL,
ADD COLUMN     "venueName" TEXT NOT NULL,
ADD COLUMN     "venuePIC" TEXT NOT NULL;

-- DropTable
DROP TABLE "venues";

-- AddForeignKey
ALTER TABLE "permitters" ADD CONSTRAINT "permitters_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
