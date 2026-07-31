/**
 * Single source of truth for the region-based color palette used across
 * ALL charts on the Survey Results Comparison page (and anywhere else region
 * colors are needed).
 *
 * Colors are FIXED per region and must never change:
 *   JABAR  → #2563EB (Blue)
 *   JATENG → #F59E0B (Amber)
 *   JATIM  → #DC2626 (Red)
 *   ALL REGION → #6B7280 (Gray)
 *
 * The goal: clients recognize a region instantly from its color, without
 * needing to re-read the legend on every chart.
 */

/**
 * Canonical region names — these are the EXACT names stored in the database
 * and returned by the API (short codes: JABAR / JATENG / JATIM).
 */
export const JABAR = "JABAR";
export const JATENG = "JATENG";
export const JATIM = "JATIM";
export const ALL_REGION = "ALL REGION";

/** Normalize any region input (full name, mixed case, extra spaces) → canonical code */
export function normalizeRegionName(name: string): string {
  const upper = name.trim().toUpperCase();
  if (upper === "JAWA BARAT") return JABAR;
  if (upper === "JAWA TENGAH") return JATENG;
  if (upper === "JAWA TIMUR") return JATIM;
  if (upper === "ALL" || upper === "SEMUA") return ALL_REGION;
  return upper;
}

/**
 * Region → color. Keys are canonical DB names (JABAR/JATENG/JATIM/ALL REGION);
 * full-name aliases (Jawa Barat...) are also included for robustness.
 * Prefer `getRegionColor()` over direct map access — it normalizes input.
 */
export const REGION_COLOR_MAP: Record<string, string> = {
  [JABAR]: "#2563EB", // Blue
  [JATENG]: "#F59E0B", // Amber
  [JATIM]: "#DC2626", // Red
  [ALL_REGION]: "#6B7280", // Gray
  // Full-name aliases
  "Jawa Barat": "#2563EB",
  "Jawa Tengah": "#F59E0B",
  "Jawa Timur": "#DC2626",
};

/** Region → short label used in legends / compact UI. */
export const REGION_SHORT_NAMES: Record<string, string> = {
  [JABAR]: "JABAR",
  [JATENG]: "JATENG",
  [JATIM]: "JATIM",
  [ALL_REGION]: "ALL REGION",
  // Full-name aliases
  "Jawa Barat": "JABAR",
  "Jawa Tengah": "JATENG",
  "Jawa Timur": "JATIM",
};

/**
 * Fixed legend order: JABAR → JATENG → JATIM → ALL REGION.
 * Legend order must never change.
 */
export const REGION_ORDER = [JABAR, JATENG, JATIM, ALL_REGION] as const;

/** Fallback color for unknown/unexpected region names. */
export const FALLBACK_REGION_COLOR = "#6B7280";

/** Get the fixed color for a region (normalizes full names, case, whitespace). */
export function getRegionColor(regionName: string): string {
  return REGION_COLOR_MAP[normalizeRegionName(regionName)] ?? FALLBACK_REGION_COLOR;
}

/** Get the short label for a region (JABAR / JATENG / JATIM / ALL REGION). */
export function getRegionShortName(regionName: string): string {
  return REGION_SHORT_NAMES[normalizeRegionName(regionName)] ?? regionName;
}

/**
 * Sort regions by the FIXED order: JABAR → JATENG → JATIM → ALL REGION.
 * Unknown regions fall back to alphabetical order (id locale).
 */
export function sortRegionsByName<T extends { name: string }>(regions: T[]): T[] {
  return [...regions].sort((a, b) => {
    const idxA = REGION_ORDER.indexOf(
      normalizeRegionName(a.name) as (typeof REGION_ORDER)[number],
    );
    const idxB = REGION_ORDER.indexOf(
      normalizeRegionName(b.name) as (typeof REGION_ORDER)[number],
    );
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.name.localeCompare(b.name, "id");
  });
}
