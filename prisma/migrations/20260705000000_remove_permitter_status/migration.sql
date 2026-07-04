-- Drop the status column from permitters table
ALTER TABLE "permitters" DROP COLUMN IF EXISTS "status";

-- Drop the PermitterStatus enum
DROP TYPE IF EXISTS "permitter_status";
