"use client";

import { sortRegionsByName } from "@/constants/region-colors";
import type { AnswerStat } from "@/types/survey";

// ─── Types ─────────────────────────────────────────────────────────────

export interface RegionDef {
  id: string;
  name: string;
  color: string;
  /** Optional short label (e.g. JABAR) shown inline on each bar */
  shortName?: string;
}

/** One region's answers for a single question */
export interface RegionAnswerData {
  regionName: string;
  answers: AnswerStat[];
}

/** True when any region has any answer with a positive count. */
export function hasAnyData(regionsData: RegionAnswerData[]): boolean {
  return regionsData.some((rd) => rd.answers.some((a) => a.count > 0));
}

export interface GroupedBarChartProps {
  /**
   * Data items where each item has `name` (answer label) plus region keys.
   * Optionally `{regionName}__pct` keys carry each region's percentage.
   */
  data: Record<string, string | number>[];
  /** Region definitions with id, name, and color */
  regions: RegionDef[];
  /** Bar border radius (default 5) */
  barRadius?: number;
}

// ═══════════════════════════════════════════════════════════════════════
// HORIZONTAL GROUPED BAR CHART — div-based, mobile-first
// ═══════════════════════════════════════════════════════════════════════

/**
 * Sort regions so bars always render in the FIXED order:
 * 1. JABAR → 2. JATENG → 3. JATIM → 4. ALL REGION (summary last)
 */
function sortRegions(regions: RegionDef[]): RegionDef[] {
  return sortRegionsByName(regions);
}

/**
 * Horizontal comparison chart — one full-width row per category with one bar
 * per region (JABAR → JATENG → JATIM → ALL REGION). Every bar shows its
 * value and percentage at the end — no tooltip dependency. Single-column
 * layout maximizes readability and makes region-to-region comparison instant.
 */
export function GroupedBarChart({
  data,
  regions,
  barRadius = 5,
}: GroupedBarChartProps) {
  const radiusStyle = { borderRadius: barRadius };
  if (!data || data.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-xl bg-gray-50 text-sm text-gray-400">
        Belum ada data
      </div>
    );
  }

  const sortedRegions = sortRegions(regions);

  // Global max so bars stay comparable across ALL categories.
  const globalMax = Math.max(
    1,
    ...data.map((row) =>
      sortedRegions.reduce((sum, r) => sum + (Number(row[r.name]) || 0), 0),
    ),
  );

  return (
    <div className="w-full">
      {/* Single column — full-width rows, never truncated labels */}
      <div className="space-y-5">
        {data.map((row) => {
          const label = String(row.name);

          return (
            <div key={label} className="min-w-0">
              {/* Category label — wraps instead of truncating */}
              <p className="mb-1.5 whitespace-normal break-words text-[13px] font-bold leading-snug text-gray-800 sm:text-sm">
                {label}
              </p>

              {/* One bar per region */}
              <div className="space-y-1">
                {sortedRegions.map((region) => {
                  const value = Number(row[region.name]) || 0;
                  const pct = Number(row[`${region.name}__pct`]) || 0;
                  const widthPct = (value / globalMax) * 100;

                  return (
                    <div key={region.id} className="flex items-center gap-2">
                      {/* Region name — colored, never truncated */}
                      <span
                        className="w-[84px] shrink-0 whitespace-nowrap text-right text-[13px] font-bold leading-none sm:w-[96px]"
                        style={{ color: region.color }}
                      >
                        {region.shortName ?? region.name}
                      </span>

                      {/* Bar track — same radius as the fill */}
                      <div
                        className="relative h-3.5 flex-1 overflow-hidden bg-gray-100/80 sm:h-4"
                        style={radiusStyle}
                      >
                        <div
                          className="h-full transition-all duration-700 ease-out"
                          style={{
                            width: `${Math.max(widthPct, value > 0 ? 2 : 0)}%`,
                            backgroundColor: region.color,
                            ...radiusStyle,
                          }}
                        />
                      </div>

                      {/* Value + percentage at the end of the bar */}
                      <span className="min-w-[96px] shrink-0 whitespace-nowrap text-right text-[13px] font-bold tabular-nums text-gray-800 sm:min-w-[116px] sm:text-sm">
                        {value}
                        <span className="ml-1 text-[13px] font-medium text-gray-500 sm:text-sm">
                          ({Math.round(pct)}%)
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Data transformation helper ────────────────────────────────────────

/**
 * Transform per-region question answers into grouped bar chart data.
 *
 * Input:
 *   regionsData = [
 *     { regionName: "JABAR", answers: [{ label: "Ibu Rumah Tangga", count: 40, percentage: 47.6 }, ...] },
 *     { regionName: "JATENG", answers: [{ label: "Ibu Rumah Tangga", count: 30, percentage: 42.9 }, ...] },
 *   ]
 *
 * Output:
 *   [
 *     { name: "Ibu Rumah Tangga", "JABAR": 40, "JABAR__pct": 47.6, "JATENG": 30, "JATENG__pct": 42.9 },
 *     { name: "Wirausaha / UMKM", ... },
 *   ]
 *
 * Rows are sorted by total count DESC so the most dominant category is first.
 */
export function buildComparisonData(
  regionsData: RegionAnswerData[],
): Record<string, string | number>[] {
  // Collect all unique answer labels (with data)
  const allLabels = new Set<string>();
  for (const rd of regionsData) {
    for (const a of rd.answers) {
      if (a.count > 0) allLabels.add(a.label);
    }
  }

  // Build chart data
  const chartData: Record<string, string | number>[] = [];
  for (const label of allLabels) {
    const item: Record<string, string | number> = { name: label };
    for (const rd of regionsData) {
      const answer = rd.answers.find((a) => a.label === label);
      item[rd.regionName] = answer?.count ?? 0;
      item[`${rd.regionName}__pct`] = answer?.percentage ?? 0;
    }
    chartData.push(item);
  }

  // Sort by total count descending
  chartData.sort((a, b) => {
    const totalA = regionsData.reduce(
      (sum, rd) => sum + ((a[rd.regionName] as number) || 0),
      0,
    );
    const totalB = regionsData.reduce(
      (sum, rd) => sum + ((b[rd.regionName] as number) || 0),
      0,
    );
    return totalB - totalA;
  });

  return chartData;
}
