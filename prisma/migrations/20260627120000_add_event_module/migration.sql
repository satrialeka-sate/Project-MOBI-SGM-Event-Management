-- Create EventStatus enum
CREATE TYPE "EventStatus" AS ENUM ('SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED');

-- Create events table
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "permitterId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "actualStartTime" TIMESTAMP(3),
    "actualEndTime" TIMESTAMP(3),
    "startedById" TEXT,
    "completedById" TEXT,
    "notes" TEXT,
    "photoUrl" TEXT,
    "status" "EventStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- Create unique index on permitterId
CREATE UNIQUE INDEX "events_permitterId_key" ON "events"("permitterId");

-- Add foreign key
ALTER TABLE "events" ADD CONSTRAINT "events_permitterId_fkey" FOREIGN KEY ("permitterId") REFERENCES "permitters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
