import OpenAI from "openai";
import { surveyAiRepository } from "@/repositories/survey-ai.repository";
import { surveyService } from "@/services/survey.service";
import type { ActorContext } from "@/types/auth";
import type { SurveyAiResult, SurveyAiAggregatePayload, SurveyAiAnalysis } from "@/types/survey-ai";
import { AppError } from "@/lib/errors";

// Lazily initialized OpenAI client
function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new AppError("AI analysis is not configured (missing API key)", 503);
  }
  return new OpenAI({ apiKey });
}

/**
 * Build an aggregate payload from the existing survey report data.
 * Reuses surveyService.getReport() so all calculations are done by Prisma/SQL.
 * No PII is included — only aggregate counts per answer option.
 */
async function buildAggregatePayload(
  actor: ActorContext,
  params: { eventId?: string; regionId?: string; startDate?: string; endDate?: string }
): Promise<SurveyAiAggregatePayload> {
  const report = await surveyService.getReport(actor, {
    eventId: params.eventId,
    regionId: params.regionId,
    startDate: params.startDate,
    endDate: params.endDate,
  });

  if (report.totalSurveys === 0) {
    throw new AppError("No survey data available for the selected filter", 404);
  }

  // Transform SurveyReport questions into record<string, number> format
  const profession: Record<string, number> = {};
  const purchaseReason: Record<string, number> = {};
  const noPurchaseReason: Record<string, number> = {};
  const packageBought: Record<string, number> = {};
  const favoriteActivity: Record<string, number> = {};
  const memorableImpression: Record<string, number> = {};
  const crewImpression: Record<string, number> = {};

  // Map questionKey to the target record
  const questionMap: Record<string, Record<string, number>> = {
    profession,
    buyingReason: purchaseReason,
    notBuyingReason: noPurchaseReason,
    package: packageBought,
    favoriteActivity,
    memorableImpression,
    crewImpression,
  };

  for (const question of report.questions) {
    const target = questionMap[question.questionKey];
    if (target) {
      for (const answer of question.answers) {
        target[answer.value] = answer.count;
      }
    }
  }

  return {
    totalSurveys: report.totalSurveys,
    totalEvents: report.totalEvents,
    totalRegions: report.totalRegions,
    periodStart: report.startDate,
    periodEnd: report.endDate,
    profession,
    purchaseReason,
    noPurchaseReason,
    packageBought,
    favoriteActivity,
    memorableImpression,
    crewImpression,
  };
}

/**
 * Build the prompt for OpenAI using the aggregate payload.
 */
function buildPrompt(payload: SurveyAiAggregatePayload): string {
  return `Anda adalah analis data survey acara SGM Ruang Tumbuh Lebih. 
Analisis data survey berikut dan berikan output dalam format JSON valid.

DATA SURVEY:
- Total Survey: ${payload.totalSurveys}
- Total Event: ${payload.totalEvents}
- Total Region: ${payload.totalRegions}
- Periode: ${payload.periodStart} sampai ${payload.periodEnd}

PROFESI RESPONDEN:
${JSON.stringify(payload.profession, null, 2)}

ALASAN MEMBELI:
${JSON.stringify(payload.purchaseReason, null, 2)}

ALASAN TIDAK MEMBELI:
${JSON.stringify(payload.noPurchaseReason, null, 2)}

PAKET YANG DIBELI:
${JSON.stringify(payload.packageBought, null, 2)}

AKTIVITAS FAVORIT:
${JSON.stringify(payload.favoriteActivity, null, 2)}

KESAN YANG DIINGAT:
${JSON.stringify(payload.memorableImpression, null, 2)}

KESAN TERHADAP CREW:
${JSON.stringify(payload.crewImpression, null, 2)}

Berikan output JSON dengan format berikut (gunakan Bahasa Indonesia):
{
  "executiveSummary": "Ringkasan eksekutif 2-3 paragraf tentang hasil survey secara keseluruhan",
  "keyInsights": ["Insight 1", "Insight 2", "Insight 3", ...],
  "recommendations": ["Rekomendasi 1", "Rekomendasi 2", "Rekomendasi 3", ...],
  "anomalies": ["Temuan penting / anomali 1", ...]
}

Pastikan:
- Gunakan Bahasa Indonesia yang baik dan benar
- keyInsights: maksimal 5 butir
- recommendations: maksimal 5 butir
- anomalies: maksimal 3 butir
- Berdasarkan data nyata, jangan mengada-adakan data
- Jangan menyebutkan nama individu atau data pribadi`;
}

/**
 * Call OpenAI Responses API and parse the JSON response.
 *
 * Uses the Responses API (client.responses.create()) which is the recommended
 * API for GPT-5.5. This replaces the legacy Chat Completions API.
 *
 * Key differences from Chat Completions:
 * - `instructions` replaces the system message (messages[0].role="system")
 * - `input` replaces the user message (messages[1].role="user")
 * - `text.format` replaces `response_format`
 * - `max_output_tokens` replaces `max_completion_tokens` / `max_tokens`
 * - `temperature` is NOT supported with GPT-5.5 (only default 1)
 * - Response uses `output_text` instead of `choices[0].message.content`
 */
async function callOpenAI(prompt: string): Promise<SurveyAiResult> {
  try {
    const openai = getOpenAIClient();

    const response = await openai.responses.create({
      model: "gpt-5.5",
      instructions: "Anda adalah analis data survey yang ahli. Selalu merespon dengan JSON valid.",
      input: prompt,
      text: {
        format: {
          type: "json_object" as const,
        },
      },
      max_output_tokens: 2000,
    });

    const content = response.output_text;
    if (!content) {
      throw new AppError("OpenAI returned empty response", 500);
    }

    const parsed = JSON.parse(content) as SurveyAiResult;

    // Validate the response structure
    if (!parsed.executiveSummary || !parsed.keyInsights || !parsed.recommendations || !parsed.anomalies) {
      throw new AppError("Invalid AI response structure", 500);
    }

    return {
      executiveSummary: parsed.executiveSummary,
      keyInsights: Array.isArray(parsed.keyInsights) ? parsed.keyInsights : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      anomalies: Array.isArray(parsed.anomalies) ? parsed.anomalies : [],
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (error instanceof SyntaxError) {
      throw new AppError("Failed to parse AI response", 500);
    }
    console.error("OpenAI API error:", error);
    throw new AppError("AI analysis service unavailable", 503);
  }
}

/**
 * Determine the scope label from params
 */
function determineScope(params: {
  eventId?: string;
  regionId?: string;
}): "EVENT" | "REGION" | "ALL" {
  if (params.eventId) return "EVENT";
  if (params.regionId) return "REGION";
  return "ALL";
}

export const surveyAiService = {
  /**
   * Get cached AI analysis for the given scope.
   * Returns null if no cached analysis exists.
   */
  async getAnalysis(
    actor: ActorContext,
    params: { eventId?: string; regionId?: string }
  ): Promise<SurveyAiAnalysis | null> {
    const scope = determineScope(params);

    return surveyAiRepository.findByScope({
      scope,
      eventId: params.eventId,
      regionId: params.regionId,
    });
  },

  /**
   * Generate new AI analysis and cache it.
   * If analysis already exists, it is replaced only after successful generation.
   * This avoids data loss if the OpenAI call fails.
   */
  async generateAnalysis(
    actor: ActorContext,
    params: { eventId?: string; regionId?: string; startDate?: string; endDate?: string }
  ): Promise<SurveyAiAnalysis> {
    const scope = determineScope(params);

    // Build aggregate data — reuses surveyService.getReport() for DB calculations
    const aggregatePayload = await buildAggregatePayload(actor, {
      eventId: params.eventId,
      regionId: params.regionId,
      startDate: params.startDate,
      endDate: params.endDate,
    });

    // Build prompt and call OpenAI
    const prompt = buildPrompt(aggregatePayload);
    const result = await callOpenAI(prompt);

    // Delete existing analysis only after successful AI response
    // (to avoid data loss if OpenAI call fails)
    await surveyAiRepository.deleteByScope({
      scope,
      eventId: params.eventId,
      regionId: params.regionId,
    });

    // Save new analysis
    return surveyAiRepository.create({
      scope,
      eventId: params.eventId ?? null,
      regionId: params.regionId ?? null,
      periodStart: aggregatePayload.periodStart ? new Date(aggregatePayload.periodStart) : null,
      periodEnd: aggregatePayload.periodEnd ? new Date(aggregatePayload.periodEnd) : null,
      executiveSummary: result.executiveSummary,
      keyInsights: result.keyInsights,
      recommendations: result.recommendations,
      anomalies: result.anomalies,
      generatedBy: actor.id,
    });
  },
};
