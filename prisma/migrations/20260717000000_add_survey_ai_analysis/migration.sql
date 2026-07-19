CREATE TABLE "survey_ai_analyses" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "eventId" TEXT,
    "regionId" TEXT,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "executiveSummary" TEXT NOT NULL,
    "keyInsights" JSONB NOT NULL,
    "recommendations" JSONB NOT NULL,
    "anomalies" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generatedBy" TEXT,

    CONSTRAINT "survey_ai_analyses_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "survey_ai_analyses_scope_eventId_regionId_idx" ON "survey_ai_analyses"("scope", "eventId", "regionId");
