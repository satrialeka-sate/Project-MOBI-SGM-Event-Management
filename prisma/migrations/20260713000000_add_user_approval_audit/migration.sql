-- Add approval audit fields to users table
ALTER TABLE "users" ADD COLUMN "approvedBy" TEXT;
ALTER TABLE "users" ADD COLUMN "approvedAt" TIMESTAMPTZ;
ALTER TABLE "users" ADD COLUMN "rejectedBy" TEXT;
ALTER TABLE "users" ADD COLUMN "rejectedAt" TIMESTAMPTZ;
ALTER TABLE "users" ADD COLUMN "rejectionReason" TEXT;
