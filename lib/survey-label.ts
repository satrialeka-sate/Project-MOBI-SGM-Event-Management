/**
 * Centralized helper to map survey enum values to human-readable labels.
 *
 * All data sent to OpenAI MUST go through these functions so that
 * the AI never sees raw database enum values like "IBU_RUMAH_TANGGA"
 * and instead receives clean labels like "Ibu Rumah Tangga".
 */
import {
  SURVEY_PROFESSION_LABELS,
  SURVEY_BUYING_REASON_LABELS,
  SURVEY_NOT_BUYING_REASON_LABELS,
  SURVEY_PACKAGE_LABELS,
  SURVEY_FAVORITE_ACTIVITY_LABELS,
  SURVEY_MEMORABLE_IMPRESSION_LABELS,
  SURVEY_CREW_IMPRESSION_LABELS,
} from "@/constants/survey-enums";

// ─── Single-value mappers ──────────────────────────────────────────────

export function getProfessionLabel(key: string): string {
  return (SURVEY_PROFESSION_LABELS as Record<string, string>)[key] ?? key;
}

export function getBuyingReasonLabel(key: string): string {
  return (SURVEY_BUYING_REASON_LABELS as Record<string, string>)[key] ?? key;
}

export function getNotBuyingReasonLabel(key: string): string {
  return (SURVEY_NOT_BUYING_REASON_LABELS as Record<string, string>)[key] ?? key;
}

export function getPackageLabel(key: string): string {
  return (SURVEY_PACKAGE_LABELS as Record<string, string>)[key] ?? key;
}

export function getFavoriteActivityLabel(key: string): string {
  return (SURVEY_FAVORITE_ACTIVITY_LABELS as Record<string, string>)[key] ?? key;
}

export function getMemorableImpressionLabel(key: string): string {
  return (SURVEY_MEMORABLE_IMPRESSION_LABELS as Record<string, string>)[key] ?? key;
}

export function getCrewImpressionLabel(key: string): string {
  return (SURVEY_CREW_IMPRESSION_LABELS as Record<string, string>)[key] ?? key;
}

// ─── Record transformer ────────────────────────────────────────────────

/**
 * Transforms a `Record<string, number>` whose keys are enum values
 * into a new record whose keys are human-readable labels.
 *
 * Example:
 *   { IBU_RUMAH_TANGGA: 40, WIRAUSAHA_UMKM: 30, ... }
 *   → { "Ibu Rumah Tangga": 40, "Wirausaha / UMKM": 30, ... }
 */
export function transformSurveyCounts(
  data: Record<string, number>,
  labelFn: (key: string) => string,
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [key, count] of Object.entries(data)) {
    result[labelFn(key)] = count;
  }
  return result;
}
