import OpenAI from "openai";
import { surveyAiRepository } from "@/repositories/survey-ai.repository";
import { surveyQuestionAiRepository } from "@/repositories/survey-question-ai.repository";
import { surveyService } from "@/services/survey.service";
import { prisma } from "@/lib/prisma";
import { excludeLegacyRegionsFilter } from "@/constants/regions";
import type { ActorContext } from "@/types/auth";
import type {
  SurveyAiResult,
  SurveyAiAggregatePayload,
  SurveyAiAnalysis,
  SurveyQuestionAiAnalysis,
} from "@/types/survey-ai";
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
    (syntaxErr as SyntaxError & { rawAttempt?: string }).rawAttempt = jsonString;
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
    if (keyInsights.length !== 4) {
      errors.push(`keyInsights must have exactly 4 items (got ${keyInsights.length})`);
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

Tugas Anda adalah menganalisis data survey berdasarkan DATA NYATA yang diberikan. Jangan membuat asumsi, opini, atau data yang tidak terdapat pada input.

=========================
INFORMASI SURVEY
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

Analisis data survey di atas dan fokuskan pada:

- Profil mayoritas responden.
- Tren pembelian.
- Faktor utama yang memengaruhi keputusan membeli.
- Faktor utama yang menyebabkan tidak membeli.
- Aktivitas event yang paling disukai.
- Persepsi responden terhadap event.
- Peluang peningkatan event berikutnya.

Gunakan hanya data yang tersedia.

Jangan mengulang seluruh data menjadi narasi panjang.

Pilih hanya temuan yang paling penting dan paling bernilai bagi client.

=========================
FORMAT OUTPUT (WAJIB)
=========================

Balas HANYA dengan JSON valid.

Jangan menggunakan markdown.
Jangan menggunakan \`\`\`json.
Jangan memberikan penjelasan di luar JSON.

Format HARUS sama persis seperti berikut:

{
  "keyInsights": [
    "Insight pertama",
    "Insight kedua",
    "Insight ketiga",
    "Insight keempat"
  ],
  "conclusion": "Kesimpulan hasil survey."
}

=========================
ATURAN PENULISAN
=========================

1. Gunakan Bahasa Indonesia yang profesional, singkat, dan mudah dipahami oleh client.

2. Output HARUS dimulai dari keyInsights, kemudian diikuti conclusion.

3. keyInsights — ATURAN KHUSUS:
- Tepat 4 Key Insight.
- Setiap Key Insight maksimal 1 kalimat.
- Panjang maksimal 25 kata per insight.
- Sebutkan hanya 1 temuan utama pada setiap insight.
- Hindari penjelasan, analisis panjang, atau rekomendasi.
- Cukup tampilkan inti informasi beserta persentase terpenting jika diperlukan.
- Jangan menggabungkan lebih dari dua topik dalam satu insight.
- Gunakan bahasa yang singkat, padat, dan mudah dipindai oleh client.

Contoh Key Insight yang BAIK:
✅ Mayoritas responden merupakan Ibu Rumah Tangga (47,6%), diikuti Wirausaha/UMKM (40,0%).
✅ Paket 1 menjadi produk yang paling banyak dibeli dengan kontribusi 36,8%.
✅ Hadiah dan gimmick acara menjadi faktor utama yang mendorong keputusan pembelian (37,6%).
✅ Bouncy Castle menjadi aktivitas favorit dan memperkuat pengalaman positif selama event.

Contoh Key Insight yang TIDAK BOLEH:
❌ Mayoritas responden berasal dari Ibu Rumah Tangga (47,6%) dan Wirausaha / UMKM (40,0%), sehingga audiens event didominasi oleh segmen keluarga dan pelaku usaha mandiri.
❌ Tren pembelian cukup positif dengan Paket 1 sebagai pilihan tertinggi (36,8%), sementara responden yang tidak membeli mencapai 31,6%. Ini menunjukkan paket entry-level paling relevan, namun masih ada ruang besar untuk konversi pembelian.

4. conclusion:
- Panjang 5–7 kalimat.
- Ringkas dan langsung ke inti.
- Merangkum keseluruhan hasil survey.
- Menjelaskan profil responden secara umum.
- Menjelaskan tren pembelian.
- Menjelaskan faktor utama pembelian atau hambatan pembelian.
- Menjelaskan aktivitas atau pengalaman event yang paling menonjol.
- Ditutup dengan SATU rekomendasi singkat untuk penyelenggaraan event berikutnya.

5. Jangan mengulang angka atau persentase yang sudah disebutkan pada Key Insights, kecuali benar-benar diperlukan.

6. Jangan membuat paragraf yang terlalu panjang.

7. Jangan memberikan rekomendasi yang tidak didukung oleh data.

8. Jika suatu kategori memiliki seluruh nilai 0 atau tidak memiliki data, jangan dianalisis dan jangan dipaksakan untuk diberi kesimpulan.

9. Jangan menyebut nama enum, kode database, atau identifier seperti:
- IBU_RUMAH_TANGGA
- WIRAUSAHA_UMKM
- MENDAPATKAN_HADIAH_GIMMICK
- STORY_TELLING
- PAKET_1

Gunakan label yang natural dan mudah dipahami, misalnya:

- Ibu Rumah Tangga
- Wirausaha / UMKM
- Profesional
- Pekerja
- Mendapatkan hadiah dan gimmick acara
- Story Telling
- Paket 1

10. Seluruh hasil analisis harus siap ditampilkan langsung kepada client tanpa perlu diedit.

11. Kembalikan HANYA JSON valid tanpa teks tambahan.
`;
}

// ─── Generic OpenAI JSON caller with retry ────────────────────────────────
async function callOpenAIJson<T>(
  prompt: string,
  validate: (parsed: Record<string, unknown>) => ValidationResult,
  transform: (parsed: Record<string, unknown>) => T
): Promise<T> {
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
          extractedJson: parseErr instanceof SyntaxError
            ? (parseErr as SyntaxError & { rawAttempt?: string }).rawAttempt
            : null,
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
      const validation = validate(parsed);
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
      const result = transform(parsed);

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

// ─── Call OpenAI (whole-report analysis) with retry ─────────────────────
async function callOpenAI(prompt: string): Promise<SurveyAiResult> {
  return callOpenAIJson(prompt, validateAiResponse, (parsed) => ({
    keyInsights: parsed.keyInsights as string[],
    conclusion: (parsed.conclusion as string).trim(),
  }));
}

// ═══════════════════════════════════════════════════════════════════════
// PER-QUESTION QUALITATIVE ANALYSIS
// ═══════════════════════════════════════════════════════════════════════

/** Questions to analyze — order matches the comparison report sections */
const QUESTION_DEFS = [
  { key: "profession", label: "Profesi Responden" },
  { key: "buyingReason", label: "Alasan Membeli" },
  { key: "notBuyingReason", label: "Alasan Tidak Membeli" },
  { key: "package", label: "Paket yang Dibeli" },
  { key: "favoriteActivity", label: "Aktivitas Favorit" },
  { key: "memorableImpression", label: "Kesan yang Paling Diingat" },
  { key: "crewImpression", label: "Crew Impression" },
];

/**
 * Build a payload with per-region question data + ALL REGION summary.
 * Reuses surveyService.getReport() for each region so all calculations
 * are done by Prisma/SQL — no business logic changes.
 */
async function buildQuestionAnalysisPayload(
  actor: ActorContext,
  params: { eventId?: string; startDate?: string; endDate?: string }
): Promise<{
  questionData: Record<string, { regionName: string; answers: { label: string; percentage: number }[] }[]>;
  totalSurveys: number;
  periodStart: string;
  periodEnd: string;
}> {
  // Operational regions (JABAR, JATENG, JATIM) — sorted alphabetically
  const regions = await prisma.region.findMany({
    where: { name: excludeLegacyRegionsFilter() },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  // Fetch per-region reports + ALL REGION report.
  // Mirrors the comparison page: when an event (venue) is selected, the page
  // queries with eventId only (no regionId), so we do the same to keep the
  // AI analysis consistent with the charts the user sees.
  const regionReports = await Promise.all(
    regions.map(async (region) => {
      const report = await surveyService.getReport(actor, {
        eventId: params.eventId,
        ...(params.eventId ? {} : { regionId: region.id }),
        startDate: params.startDate,
        endDate: params.endDate,
      });
      return { regionName: region.name, report };
    })
  );

  const allReport = await surveyService.getReport(actor, {
    eventId: params.eventId,
    startDate: params.startDate,
    endDate: params.endDate,
  });

  if (allReport.totalSurveys === 0) {
    throw new AppError("No survey data available for the selected filter", 404);
  }

  // Build per-question data keyed by questionKey
  const questionData: Record<string, { regionName: string; answers: { label: string; percentage: number }[] }[]> = {};

  for (const q of QUESTION_DEFS) {
    const entries = regionReports.map((rr) => {
      const question = rr.report.questions.find((x) => x.questionKey === q.key);
      const answers =
        question?.answers
          .filter((a) => a.count > 0)
          .map((a) => ({ label: a.label, percentage: a.percentage })) ?? [];
      return { regionName: rr.regionName, answers };
    });

    // ALL REGION summary
    const allQuestion = allReport.questions.find((x) => x.questionKey === q.key);
    const allAnswers =
      allQuestion?.answers
        .filter((a) => a.count > 0)
        .map((a) => ({ label: a.label, percentage: a.percentage })) ?? [];

    questionData[q.key] = [...entries, { regionName: "ALL REGION", answers: allAnswers }];
  }

  return {
    questionData,
    totalSurveys: allReport.totalSurveys,
    periodStart: allReport.startDate,
    periodEnd: allReport.endDate,
  };
}

/** Format answers for the prompt */
function fmtQuestionAnswers(answers: { label: string; percentage: number }[]): string {
  if (answers.length === 0) return "(tidak ada data)";
  return answers
    .map((a) => `${a.label} (${a.percentage}%)`)
    .join(", ");
}

/** Build the prompt that generates ALL per-question analyses in one call */
function buildQuestionPrompt(payload: {
  questionData: Record<string, { regionName: string; answers: { label: string; percentage: number }[] }[]>;
  totalSurveys: number;
  periodStart: string;
  periodEnd: string;
}): string {
  const blocks = QUESTION_DEFS.map((q, idx) => {
    const entries = payload.questionData[q.key] ?? [];
    const lines = entries
      .map((e) => `- ${e.regionName}: ${fmtQuestionAnswers(e.answers)}`)
      .join("\n");
    return `PERTANYAAN ${String(idx + 1).padStart(2, "0")}: ${q.label}\n${lines}`;
  }).join("\n\n");

  return `
Anda adalah Senior Business Intelligence Analyst yang bertugas membuat analisa kualitatif hasil survey Event SGM Ruang Tumbuh Lebih.

Tugas Anda adalah menganalisis data survey berdasarkan DATA NYATA yang diberikan. Jangan membuat asumsi, opini, atau data yang tidak terdapat pada input.

=========================
INFORMASI SURVEY
=========================

Total Survey      : ${payload.totalSurveys}
Periode Survey    : ${payload.periodStart} sampai ${payload.periodEnd}

Setiap pertanyaan menampilkan distribusi jawaban (persentase) untuk setiap region:
- Jawa Barat (JABAR)
- Jawa Tengah (JATENG)
- Jawa Timur (JATIM)
- ALL REGION (ringkasan seluruh region)

=========================
HASIL SURVEY
=========================

${blocks}

=========================
TUGAS ANALISIS
=========================

Untuk SETIAP pertanyaan di atas, tulis analisa kualitatif singkat dengan ketentuan:

1. Maksimal 3 kalimat per pertanyaan.
2. Singkat, profesional, dan mudah dipahami oleh client.
3. Kalimat pertama: bandingkan antar region (sebutkan region yang paling menonjol dibanding region lain).
4. Kalimat terakhir: kesimpulan berdasarkan ALL REGION.
5. Harus ada insight perbandingan antar region — JANGAN hanya menjelaskan ALL REGION.
6. Fokus pada insight dan temuan utama, JANGAN mengulang semua angka yang sudah terlihat di data.
7. Jangan menyebut nama enum, kode database, atau identifier seperti IBU_RUMAH_TANGGA, PAKET_1, dsb. Gunakan label yang natural.
8. Jika suatu kategori seluruhnya 0 atau tidak ada data, jangan dipaksakan untuk dianalisis.
9. Gunakan Bahasa Indonesia.

Contoh gaya penulisan yang BAIK:
"JATENG menunjukkan tingkat pembelian Paket 1 paling tinggi dibanding region lainnya, sedangkan JABAR memiliki proporsi responden yang tidak membeli paling besar. Secara keseluruhan, ALL REGION memperlihatkan bahwa Paket 1 masih menjadi pilihan utama sehingga strategi promosi dapat difokuskan pada paket tersebut."

=========================
FORMAT OUTPUT (WAJIB)
=========================

Balas HANYA dengan JSON valid.
Jangan menggunakan markdown.
Jangan menggunakan \`\`\`json.
Jangan memberikan penjelasan di luar JSON.

Format HARUS sama persis seperti berikut (gunakan questionKey sebagai nama properti):

{
  "profession": "analisa...",
  "buyingReason": "analisa...",
  "notBuyingReason": "analisa...",
  "package": "analisa...",
  "favoriteActivity": "analisa...",
  "memorableImpression": "analisa...",
  "crewImpression": "analisa..."
}

Setiap nilai HARUS berupa string analisa maksimal 3 kalimat.
Kembalikan HANYA JSON valid tanpa teks tambahan.
`;
}

/**
 * Validate per-question response — at least one question key must be a
 * non-empty string. Missing/empty keys are dropped (partial results are
 * salvaged instead of failing the whole generation).
 */
function validateQuestionResponse(parsed: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];
  let validCount = 0;
  for (const q of QUESTION_DEFS) {
    const val = parsed[q.key];
    if (typeof val === "string" && val.trim().length > 0) {
      validCount++;
    }
  }
  if (validCount === 0) {
    errors.push("At least one question analysis must be a non-empty string");
  }
  return { valid: errors.length === 0, errors };
}

/** Call OpenAI for all per-question analyses in a single request */
async function callQuestionOpenAI(prompt: string): Promise<Record<string, string>> {
  const parsed = await callOpenAIJson(prompt, validateQuestionResponse, (p) => p);
  const result: Record<string, string> = {};
  for (const q of QUESTION_DEFS) {
    const val = parsed[q.key];
    if (typeof val === "string" && val.trim().length > 0) {
      result[q.key] = val.trim();
    }
  }
  return result;
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

  /**
   * Get cached per-question AI analyses for the given scope.
   * When date filters are provided, only analyses generated with the exact
   * same requested period are returned (avoids showing stale analyses).
   * Returns an empty array when no matching analyses exist.
   */
  async getQuestionAnalyses(
    actor: ActorContext,
    params: { eventId?: string; regionId?: string; startDate?: string; endDate?: string }
  ): Promise<SurveyQuestionAiAnalysis[]> {
    const scope = determineScope(params);
    const analyses = await surveyQuestionAiRepository.findByScope({
      scope,
      eventId: params.eventId,
      regionId: params.regionId,
    });

    // Filter by the exact requested period (YYYY-MM-DD stored as UTC date)
    return analyses.filter((a) => {
      const matchStart = !params.startDate
        ? a.periodStart === null
        : a.periodStart !== null && a.periodStart.slice(0, 10) === params.startDate;
      const matchEnd = !params.endDate
        ? a.periodEnd === null
        : a.periodEnd !== null && a.periodEnd.slice(0, 10) === params.endDate;
      return matchStart && matchEnd;
    });
  },

  /**
   * Generate per-question qualitative analyses (ALL questions in one OpenAI call)
   * and persist them with the actual generation timestamp.
   * Existing analyses are replaced only after successful generation.
   */
  async generateQuestionAnalyses(
    actor: ActorContext,
    params: { eventId?: string; startDate?: string; endDate?: string }
  ): Promise<SurveyQuestionAiAnalysis[]> {
    const scope: "EVENT" | "REGION" | "ALL" = params.eventId ? "EVENT" : "ALL";

    // Build region comparison payload (JABAR / JATENG / JATIM / ALL REGION)
    const payload = await buildQuestionAnalysisPayload(actor, {
      eventId: params.eventId,
      startDate: params.startDate,
      endDate: params.endDate,
    });

    // Build prompt + call OpenAI (with retry)
    const prompt = buildQuestionPrompt(payload);
    const result = await callQuestionOpenAI(prompt);

    // Delete existing analyses only after successful AI response
    await surveyQuestionAiRepository.deleteByScope({
      scope,
      eventId: params.eventId,
    });

    // Persist all per-question analyses with real generation timestamp.
    // periodStart/periodEnd store the REQUESTED filter period (not data span)
    // so GET can match analyses to the exact filter that produced them.
    // Partial results are salvaged — only successfully generated keys persist.
    const entries = QUESTION_DEFS
      .filter((q) => result[q.key])
      .map((q) => ({
        scope,
        eventId: params.eventId ?? null,
        regionId: null,
        questionKey: q.key,
        analysis: result[q.key],
        periodStart: params.startDate ? new Date(params.startDate) : null,
        periodEnd: params.endDate ? new Date(params.endDate) : null,
        generatedBy: actor.id,
      }));

    if (entries.length === 0) {
      throw new AppError("AI analysis produced no usable results", 500);
    }

    return surveyQuestionAiRepository.createMany(entries);
  },
};
