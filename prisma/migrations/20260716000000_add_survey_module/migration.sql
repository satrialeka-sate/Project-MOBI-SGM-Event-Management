-- Create Survey answer enums
CREATE TYPE "survey_profession" AS ENUM ('IBU_RUMAH_TANGGA', 'WIRAUSAHA_UMKM', 'PROFESIONAL', 'PEKERJA');
CREATE TYPE "survey_not_buying_reason" AS ENUM ('PAKET_TIDAK_MENARIK', 'ANAK_TIDAK_MINUM_SUSU', 'ANAK_SUDAH_MINUM_MERK_LAIN', 'TIDAK_MEMBAWA_UANG');
CREATE TYPE "survey_buying_reason" AS ENUM ('MENDAPATKAN_HADIAH_GIMMICK', 'ANAK_SUKA_RASA_SGM', 'MENAMBAH_ASUPAN_GIZI');
CREATE TYPE "survey_package" AS ENUM ('PAKET_1', 'PAKET_2', 'PAKET_3', 'TIDAK_MEMBELI');
CREATE TYPE "survey_favorite_activity" AS ENUM ('STORY_TELLING', 'BOUNCY_CASTLE', 'MINI_PERPPUSTAKAAN', 'METAMORPHOSIS_PUZZLE', 'WORKSHOP_PRAKARYA', 'DOOR_PRIZE');
CREATE TYPE "survey_memorable_impression" AS ENUM ('MOBIL_SGM', 'SGM_RUANG_TUMBUH_LEBIH', 'PAKET_PENJUALAN_MENARIK', 'BANYAK_PERMAINAN_ANAK');
CREATE TYPE "survey_crew_impression" AS ENUM ('MENYENANGKAN_DAN_RAMAH', 'TERLALU_PENDIAM', 'BANYAK_BERCANDA');

-- Create Survey table
CREATE TABLE "surveys" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "surveyDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    -- Question 1
    "profession" "survey_profession" NOT NULL,
    -- Question 2
    "notBuyingReason" "survey_not_buying_reason" NOT NULL,
    -- Question 3
    "buyingReason" "survey_buying_reason" NOT NULL,
    -- Question 4
    "package" "survey_package" NOT NULL,
    -- Question 5
    "favoriteActivity" "survey_favorite_activity" NOT NULL,
    -- Question 6
    "memorableImpression" "survey_memorable_impression" NOT NULL,
    -- Question 7
    "crewImpression" "survey_crew_impression" NOT NULL,

    CONSTRAINT "surveys_pkey" PRIMARY KEY ("id")
);

-- Add foreign keys
ALTER TABLE "surveys" ADD CONSTRAINT "surveys_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "surveys" ADD CONSTRAINT "surveys_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "surveys" ADD CONSTRAINT "surveys_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Create indexes
CREATE INDEX "surveys_eventId_idx" ON "surveys"("eventId");
CREATE INDEX "surveys_regionId_idx" ON "surveys"("regionId");
CREATE INDEX "surveys_createdBy_idx" ON "surveys"("createdBy");
CREATE INDEX "surveys_surveyDate_idx" ON "surveys"("surveyDate");
