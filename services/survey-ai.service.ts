import OpenAI from "openai";
import { surveyAiRepository } from "@/repositories/survey-ai.repository";
import { surveyService } from "@/services/survey.service";
import type { ActorContext } from "@/types/auth";
import type { SurveyAiResult, SurveyAiAggregatePayload, SurveyAiAnalysis } from "@/types/survey-ai";
import { AppError } from "@/lib/errors";
import {
  getProfessionLabel,
  getBuyingReasonLabel,
  getNotBuyingReasonLabel,
  getPackageLabel,
  getFavoriteActivityLabel,
  getMemorableImpressionLabel,
  getCrewImpressionLabel,
  transformSurveyCounts,
} from "@/lib/survey-label";

// ─── Constants ─────────────────────────────────────────────────────────
const MAX_RETRIES = 3;
const OPENAI_MODEL = "gpt-5.5";
const MAX_OUTPUT_TOKENS = 2000;

// ─── Lazily initialized OpenAI client ───────────────────────────────────
function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new AppError("AI analysis is not configured (missing API key)", 503);
  }
  return new OpenAI({ apiKey });
}

// ─── Logging helper ─────────────────────────────────────────────────────
function logSection(label: string, content: unknown): void {
  const bar = "═".repeat(60);
  console.log(`\n${bar}`);
  console.log(`  ${label}`);
  console.log(`${bar}`);
  if (typeof content === "string") {
    console.log(content);
  } else {
    console.log(JSON.stringify(content, null, 2));
  }
  console.log(`${bar}\n`);
}

// ─── Robust JSON extraction ─────────────────────────────────────────────
/**
 * Extracts the first valid JSON object from a string.
 * Handles:
 *   - Markdown code fences (```json ... ```)
 *   - Leading/trailing text before/after JSON
 *   - Whitespace padding
 *   - Single-quoted keys (replaces with double-quoted)
 *   - Trailing commas
 */
function extractJson(raw: string): string {
  let cleaned = raw.trim();

  // 1. Strip markdown code fences (```json ... ``` or ``` ... ```)
  const fenceRegex = /^```(?:json)?\s*\n?([\s\S]*?)\n?```\s*$/;
  const fenceMatch = cleaned.match(fenceRegex);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }

  // 2. Find the first '{' and last '}'
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new SyntaxError("No JSON object found in response");
  }

  cleaned = cleaned.slice(firstBrace, lastBrace + 1);

  // 3. Remove trailing commas before closing braces/brackets
  cleaned = cleaned.replace(/,\s*}/g, "}");
  cleaned = cleaned.replace(/,\s*\]/g, "]");

  return cleaned;
}

/**
 * Safely parse JSON with error context.
 */
function safeParse(raw: string): Record<string, unknown> {
  const jsonString = extractJson(raw);
  try {
    const parsed = JSON.parse(jsonString);
    if (typeof parsed !== "object" || parsed === null) {
      throw new SyntaxError("Parsed JSON is not an object");
    }
    return parsed as Record<string, unknown>;
  } catch (err) {
    // Re-throw with more context
    const syntaxErr = err instanceof SyntaxError ? err : new SyntaxError(String(err));
    (syntaxErr as any).rawAttempt = jsonString;
    throw syntaxErr;
  }
}

// ─── Response validation ────────────────────────────────────────────────
interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function validateAiResponse(parsed: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];
  const keyInsights = parsed.keyInsights as unknown[];

  // keyInsights must be an array of strings, exactly 5 items
  if (!Array.isArray(keyInsights)) {
    errors.push("keyInsights must be an array");
  } else {
    if (keyInsights.length !== 5) {
      errors.push(`keyInsights must have exactly 5 items (got ${keyInsights.length})`);
    }
    for (let i = 0; i < keyInsights.length; i++) {
      if (typeof keyInsights[i] !== "string") {
        errors.push(`keyInsights[${i}] must be a string`);
      }
    }
  }

  // conclusion must be a non-empty string
  if (typeof parsed.conclusion !== "string" || parsed.conclusion.trim().length === 0) {
    errors.push("conclusion must be a non-empty string");
  }

  return { valid: errors.length === 0, errors };
}

// ─── Build aggregate payload ────────────────────────────────────────────
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
  // All enum keys are immediately converted to human-readable labels.
  const rawProfession: Record<string, number> = {};
  const rawPurchaseReason: Record<string, number> = {};
  const rawNoPurchaseReason: Record<string, number> = {};
  const rawPackageBought: Record<string, number> = {};
  const rawFavoriteActivity: Record<string, number> = {};
  const rawMemorableImpression: Record<string, number> = {};
  const rawCrewImpression: Record<string, number> = {};

  // Map questionKey to the target record
  const questionMap: Record<string, Record<string, number>> = {
    profession: rawProfession,
    buyingReason: rawPurchaseReason,
    notBuyingReason: rawNoPurchaseReason,
    package: rawPackageBought,
    favoriteActivity: rawFavoriteActivity,
    memorableImpression: rawMemorableImpression,
    crewImpression: rawCrewImpression,
  };

  for (const question of report.questions) {
    const target = questionMap[question.questionKey];
    if (target) {
      for (const answer of question.answers) {
        target[answer.value] = answer.count;
      }
    }
  }

  // Convert enum keys to human-readable labels
  const profession = transformSurveyCounts(rawProfession, getProfessionLabel);
  const purchaseReason = transformSurveyCounts(rawPurchaseReason, getBuyingReasonLabel);
  const noPurchaseReason = transformSurveyCounts(rawNoPurchaseReason, getNotBuyingReasonLabel);
  const packageBought = transformSurveyCounts(rawPackageBought, getPackageLabel);
  const favoriteActivity = transformSurveyCounts(rawFavoriteActivity, getFavoriteActivityLabel);
  const memorableImpression = transformSurveyCounts(rawMemorableImpression, getMemorableImpressionLabel);
  const crewImpression = transformSurveyCounts(rawCrewImpression, getCrewImpressionLabel);

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

// ─── Build prompt for OpenAI ────────────────────────────────────────────
function buildPrompt(payload: SurveyAiAggregatePayload): string {
  // Format survey data as a clean, client-friendly text summary
  function fmt(data: Record<string, number>): string {
    return Object.entries(data)
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => {
        const pct = ((count / payload.totalSurveys) * 100).toFixed(1);
        return `- ${label} : ${pct}%`;
      })
      .join("\n");
  }

  return `
Anda adalah seorang Senior Business Intelligence Analyst yang bertugas menganalisis hasil survey Event SGM Ruang Tumbuh Lebih.

Tugas Anda adalah membuat analisis berdasarkan DATA NYATA yang diberikan. Jangan membuat asumsi atau menambahkan data yang tidak ada.

=========================
INFORMASI UMUM
=========================

Total Survey      : ${payload.totalSurveys}
Total Event       : ${payload.totalEvents}
Total Region      : ${payload.totalRegions}
Periode Survey    : ${payload.periodStart} sampai ${payload.periodEnd}

=========================
HASIL SURVEY
=========================

PROFESI RESPONDEN
${fmt(payload.profession)}

ALASAN MEMBELI
${fmt(payload.purchaseReason)}

ALASAN TIDAK MEMBELI
${fmt(payload.noPurchaseReason)}

PAKET YANG DIBELI
${fmt(payload.packageBought)}

AKTIVITAS FAVORIT
${fmt(payload.favoriteActivity)}

KESAN YANG PALING DIINGAT
${fmt(payload.memorableImpression)}

KESAN TERHADAP CREW EVENT
${fmt(payload.crewImpression)}

=========================
TUGAS ANALISIS
=========================

Lakukan analisis terhadap seluruh data survey di atas.

Analisis harus mampu menemukan:
- Pola jawaban responden.
- Tren pembelian.
- Perilaku konsumen.
- Aktivitas favorit selama event.
- Faktor utama yang memengaruhi pembelian.
- Persepsi konsumen terhadap event.
- Persepsi konsumen terhadap kru (man power).
- Peluang peningkatan kualitas event berikutnya.

Jangan membuat asumsi yang tidak didukung oleh data.

=========================
OUTPUT — FORMAT WAJIB
=========================

Balas HANYA dengan JSON valid. Ikuti format di bawah ini PERSIS.

Jangan gunakan markdown.
Jangan gunakan \`\`\`json.
Jangan tambahkan kalimat pembuka atau penutup.
Jangan berikan penjelasan apa pun di luar JSON.

{
  "keyInsights": [
    "Insight 1 — berdasarkan data, 1-3 kalimat.",
    "Insight 2 — berdasarkan data, 1-3 kalimat.",
    "Insight 3 — berdasarkan data, 1-3 kalimat.",
    "Insight 4 — berdasarkan data, 1-3 kalimat.",
    "Insight 5 — berdasarkan data, 1-3 kalimat."
  ],
  "conclusion": "Kesimpulan analisis sepanjang 5-10 kalimat yang merangkum seluruh hasil survey."
}

=========================
ATURAN PENULISAN
=========================

1. Gunakan Bahasa Indonesia yang profesional, mudah dipahami, dan cocok ditampilkan langsung kepada client tanpa perlu diedit.

2. keyInsights: Tepat 5 poin, masing-masing 1-3 kalimat, berdasarkan data.

3. conclusion: 5-10 kalimat yang merangkum seluruh hasil survey.
   - Jelaskan gambaran umum hasil survey.
   - Sebutkan kecenderungan perilaku konsumen.
   - Jelaskan faktor yang paling memengaruhi pembelian.
   - Jelaskan aktivitas yang paling diminati.
   - Jelaskan persepsi konsumen terhadap event dan kru.
   - Tutup dengan rekomendasi profesional.

4. Jangan mengarang data atau persentase yang tidak terdapat pada input.

5. Kembalikan HANYA JSON. Tanpa markdown. Tanpa \`\`\`. Tanpa teks lain.
`;
}

// ─── Call OpenAI with retry ─────────────────────────────────────────────
async function callOpenAI(prompt: string): Promise<SurveyAiResult> {
  const startTime = Date.now();
  let lastError: Error | null = null;

  // Log the prompt once
  logSection("PROMPT SENT TO OPENAI", prompt);
  logSection("MODEL USED", OPENAI_MODEL);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 1) {
        console.log(`\n🔄 Retry attempt ${attempt}/${MAX_RETRIES}...`);
      }

      const openai = getOpenAIClient();

      const response = await openai.responses.create({
        model: OPENAI_MODEL,
        instructions:
          "Anda adalah analis data survey yang ahli. " +
          "Anda HANYA boleh merespon dengan JSON murni. " +
          "Jangan gunakan markdown. Jangan gunakan ```json. " +
          "Jangan tambahkan teks apa pun di luar JSON.",
        input: prompt,
        text: {
          format: {
            type: "json_object" as const,
          },
        },
        max_output_tokens: MAX_OUTPUT_TOKENS,
      });

      const content = response.output_text;
      const duration = Date.now() - startTime;

      // Log raw response
      logSection(`RAW OPENAI RESPONSE (attempt ${attempt}, ${duration}ms)`, content || "(empty)");

      if (!content || content.trim().length === 0) {
        lastError = new Error("OpenAI returned empty response");
        logSection("ERROR", `Attempt ${attempt}: ${lastError.message}`);
        continue; // retry
      }

      // Parse JSON (with markdown stripping, etc.)
      let parsed: Record<string, unknown>;
      try {
        parsed = safeParse(content);
      } catch (parseErr) {
        const errMsg = parseErr instanceof SyntaxError ? parseErr.message : String(parseErr);
        lastError = new Error(`JSON parse failed: ${errMsg}`);

        logSection("JSON PARSE ERROR", {
          attempt,
          error: errMsg,
          rawResponse: content,
          extractedJson: parseErr instanceof SyntaxError ? (parseErr as any).rawAttempt : null,
        });

        if (attempt < MAX_RETRIES) continue;
        throw new AppError(
          `AI analysis failed after ${MAX_RETRIES} attempts: JSON parse error - ${errMsg}`,
          500
        );
      }

      // Log parsed result
      logSection("PARSED JSON", parsed);

      // Validate response structure
      const validation = validateAiResponse(parsed);
      if (!validation.valid) {
        lastError = new Error(`Invalid response structure: ${validation.errors.join("; ")}`);

        logSection("VALIDATION ERROR", {
          attempt,
          errors: validation.errors,
          parsed,
        });

        if (attempt < MAX_RETRIES) continue;
        throw new AppError(
          `AI analysis failed after ${MAX_RETRIES} attempts: ${lastError.message}`,
          500
        );
      }

      // Success — return clean result
      const result: SurveyAiResult = {
        keyInsights: parsed.keyInsights as string[],
        conclusion: (parsed.conclusion as string).trim(),
      };

      logSection("FINAL PARSED RESULT", result);
      console.log(`⏱️  Total duration: ${Date.now() - startTime}ms`);

      return result;
    } catch (error) {
      // Re-throw AppError immediately (these are domain errors, not retryable)
      if (error instanceof AppError) throw error;

      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < MAX_RETRIES) {
        console.log(`\n⚠️  Attempt ${attempt} failed: ${lastError.message}. Retrying...`);
      } else {
        // All retries exhausted
        logSection("ALL RETRIES EXHAUSTED", {
          attempts: MAX_RETRIES,
          lastError: lastError.message,
          duration: Date.now() - startTime,
        });
        throw new AppError(
          `AI analysis failed after ${MAX_RETRIES} attempts: ${lastError.message}`,
          500
        );
      }
    }
  }

  // Should never reach here
  throw new AppError("AI analysis failed unexpectedly", 500);
}

// ─── Determine scope label ──────────────────────────────────────────────
function determineScope(params: {
  eventId?: string;
  regionId?: string;
}): "EVENT" | "REGION" | "ALL" {
  if (params.eventId) return "EVENT";
  if (params.regionId) return "REGION";
  return "ALL";
}

// ─── Exported service ───────────────────────────────────────────────────
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

    // Build prompt and call OpenAI (with retry)
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
      // Map conclusion → executiveSummary for DB storage (field reuse)
      executiveSummary: result.conclusion,
      keyInsights: result.keyInsights,
      recommendations: [],
      anomalies: [],
      generatedBy: actor.id,
    });
  },
};
