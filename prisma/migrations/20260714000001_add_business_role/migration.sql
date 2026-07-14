-- Add businessRole column to users table
-- This stores the explicit business role (SGM, Starlight, PO, PIC, etc.)
-- separately from the authorization role and level.
ALTER TABLE "users" ADD COLUMN "business_role" TEXT NOT NULL DEFAULT 'PERMITTER';
