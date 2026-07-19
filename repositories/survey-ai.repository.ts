import { prisma } from "@/lib/prisma";
import type { SurveyAiAnalysis } from "@/types/survey-ai";

/** Scope identifier for the analysis */
type AnalysisScope = "EVENT" | "REGION" | "ALL";

interface FindByScopeParams {
  scope: AnalysisScope;
  eventId?: string;
  regionId?: string;
}

interface CreateAnalysisData {
  scope: AnalysisScope;
  eventId?: string | null;
  regionId?: string | null;
  periodStart?: Date | null;
  periodEnd?: Date | null;
  executiveSummary: string;
  keyInsights: unknown;
  recommendations: unknown;
  anomalies: unknown;
  generatedBy?: string | null;
}

function toAnalysis(row: Record<string, unknown>): SurveyAiAnalysis {
  return {
    id: row.id as string,
    scope: row.scope as SurveyAiAnalysis["scope"],
    eventId: row.eventId as string | null,
    regionId: row.regionId as string | null,
    periodStart: row.periodStart ? (row.periodStart as Date).toISOString() : null,
    periodEnd: row.periodEnd ? (row.periodEnd as Date).toISOString() : null,
    executiveSummary: row.executiveSummary as string,
    keyInsights: row.keyInsights as string[],
    recommendations: row.recommendations as string[],
    anomalies: row.anomalies as string[],
    generatedAt: (row.generatedAt as Date).toISOString(),
    generatedBy: row.generatedBy as string | null,
  };
}

export const surveyAiRepository = {
  async findByScope(params: FindByScopeParams): Promise<SurveyAiAnalysis | null> {
    const where: Record<string, unknown> = {
      scope: params.scope,
    };

    if (params.scope === "EVENT" && params.eventId) {
      where.eventId = params.eventId;
    } else if (params.scope === "REGION" && params.regionId) {
      where.regionId = params.regionId;
    }

    const record = await prisma.surveyAiAnalysis.findFirst({
      where,
      orderBy: { generatedAt: "desc" },
    });

    return record ? toAnalysis(record as unknown as Record<string, unknown>) : null;
  },

  async create(data: CreateAnalysisData): Promise<SurveyAiAnalysis> {
    const record = await prisma.surveyAiAnalysis.create({
      data: {
        scope: data.scope,
        eventId: data.eventId ?? null,
        regionId: data.regionId ?? null,
        periodStart: data.periodStart ?? null,
        periodEnd: data.periodEnd ?? null,
        executiveSummary: data.executiveSummary,
        keyInsights: data.keyInsights as any,
        recommendations: data.recommendations as any,
        anomalies: data.anomalies as any,
        generatedBy: data.generatedBy ?? null,
      },
    });

    return toAnalysis(record as unknown as Record<string, unknown>);
  },

  async deleteByScope(params: FindByScopeParams): Promise<void> {
    const where: Record<string, unknown> = {
      scope: params.scope,
    };

    if (params.scope === "EVENT" && params.eventId) {
      where.eventId = params.eventId;
    } else if (params.scope === "REGION" && params.regionId) {
      where.regionId = params.regionId;
    }

    await prisma.surveyAiAnalysis.deleteMany({ where });
  },
};
