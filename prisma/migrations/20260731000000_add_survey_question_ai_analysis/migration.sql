-- CreateTable
CREATE TABLE "survey_question_ai_analyses" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "eventId" TEXT,
    "regionId" TEXT,
    "questionKey" TEXT NOT NULL,
    "analysis" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generatedBy" TEXT,

    CONSTRAINT "survey_question_ai_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "survey_question_ai_analyses_scope_eventId_questionKey_idx" ON "survey_question_ai_analyses"("scope", "eventId", "questionKey");

-- CreateIndex
CREATE INDEX "survey_question_ai_analyses_scope_regionId_questionKey_idx" ON "survey_question_ai_analyses"("scope", "regionId", "questionKey");
