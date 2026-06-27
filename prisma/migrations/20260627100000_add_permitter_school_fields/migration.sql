-- Add the missing unique constraint on venues (name, regionId)
CREATE UNIQUE INDEX "venues_name_regionId_key" ON "venues"("name", "regionId");

-- Add status column to permitters
ALTER TABLE "permitters" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active';

-- Add school fields to permitter_schools
ALTER TABLE "permitter_schools" ADD COLUMN "schoolAddress" TEXT NOT NULL DEFAULT '';
ALTER TABLE "permitter_schools" ADD COLUMN "totalStudents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "permitter_schools" ADD COLUMN "picName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "permitter_schools" ADD COLUMN "picPhone" TEXT NOT NULL DEFAULT '';
