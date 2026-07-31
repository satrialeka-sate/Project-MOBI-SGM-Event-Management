import { prisma } from "@/lib/prisma";
import type { SurveyQuestionAiAnalysis } from "@/types/survey-ai";

/** Scope identifier for the analysis */
type AnalysisScope = "EVENT" | "REGION" | "ALL";

interface FindByScopeParams {
  scope: AnalysisScope;
  eventId?: string;
  regionId?: string;
}

interface CreateQuestionAnalysisData {
  scope: AnalysisScope;
  eventId?: string | null;
  regionId?: string | null;
  questionKey: string;
  analysis: string;
  periodStart?: Date | null;
  periodEnd?: Date | null;
  generatedBy?: string | null;
}

function toAnalysis(row: Record<string, unknown>): SurveyQuestionAiAnalysis {
  return {
    id: row.id as string,
    scope: row.scope as SurveyQuestionAiAnalysis["scope"],
    eventId: row.eventId as string | null,
    regionId: row.regionId as string | null,
    questionKey: row.questionKey as string,
    analysis: row.analysis as string,
    periodStart: row.periodStart ? (row.periodStart as Date).toISOString() : null,
    periodEnd: row.periodEnd ? (row.periodEnd as Date).toISOString() : null,
    generatedAt: (row.generatedAt as Date).toISOString(),
    generatedBy: row.generatedBy as string | null,
  };
}

function buildWhere(params: FindByScopeParams): Record<string, unknown> {
  const where: Record<string, unknown> = {
    scope: params.scope,
  };
  if (params.scope === "EVENT" && params.eventId) {
    where.eventId = params.eventId;
  } else if (params.scope === "REGION" && params.regionId) {
    where.regionId = params.regionId;
  }
  return where;
}

export const surveyQuestionAiRepository = {
  /**
   * Fetch all cached per-question analyses for the given scope.
   * Returns an empty array when no analyses exist.
   */
  async findByScope(params: FindByScopeParams): Promise<SurveyQuestionAiAnalysis[]> {
    const rows = await prisma.surveyQuestionAiAnalysis.findMany({
      where: buildWhere(params),
      orderBy: { generatedAt: "desc" },
    });
    return rows.map((r) => toAnalysis(r as unknown as Record<string, unknown>));
  },

  /**
   * Delete all per-question analyses for the given scope.
   */
  async deleteByScope(params: FindByScopeParams): Promise<void> {
    await prisma.surveyQuestionAiAnalysis.deleteMany({
      where: buildWhere(params),
    });
  },

  /**
   * Persist per-question analyses in a single transaction.
   */
  async createMany(data: CreateQuestionAnalysisData[]): Promise<SurveyQuestionAiAnalysis[]> {
    const rows = await prisma.surveyQuestionAiAnalysis.createManyAndReturn({
      data: data.map((d) => ({
        scope: d.scope,
        eventId: d.eventId ?? null,
        regionId: d.regionId ?? null,
        questionKey: d.questionKey,
        analysis: d.analysis,
        periodStart: d.periodStart ?? null,
        periodEnd: d.periodEnd ?? null,
        generatedBy: d.generatedBy ?? null,
      })),
    });
    return rows.map((r) => toAnalysis(r as unknown as Record<string, unknown>));
  },
};
