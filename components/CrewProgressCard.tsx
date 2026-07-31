"use client";

import {
  hasAnyData,
  type RegionAnswerData,
} from "@/components/GroupedBarChart";
import {
  getRegionColor,
  getRegionShortName,
} from "@/constants/region-colors";

// ═══════════════════════════════════════════════════════════════════════
// CREW IMPRESSION — Progress Comparison Card
// ═══════════════════════════════════════════════════════════════════════

/**
 * Compact progress comparison for the Crew Impression question. Shows the
 * share of the "positive" answer per region as a progress bar — perfect for a
 * small amount of data. When there is no data at all, shows a friendly empty
 * state instead of a chart.
 */
export function CrewProgressCard({
  regionsData,
  positiveLabel,
}: {
  regionsData: RegionAnswerData[];
  /** The label treated as the positive outcome (e.g. "Menyenangkan dan Ramah") */
  positiveLabel: string;
}) {
  const hasAny = hasAnyData(regionsData);

  // ── Empty state ──
  if (!hasAny) {
    return (
      <div className="flex min-h-[110px] items-center justify-center rounded-xl bg-gray-50/80 px-4 py-6 text-center ring-1 ring-gray-100/60">
        <p className="max-w-xs text-[13px] font-medium leading-relaxed text-gray-400 sm:text-sm">
          Belum terdapat data yang cukup untuk dianalisis.
        </p>
      </div>
    );
  }

  const rows = regionsData.map((rd) => {
    const total = rd.answers.reduce((s, a) => s + a.count, 0);
    const positive = rd.answers.find((a) => a.label === positiveLabel);
    const count = positive?.count ?? 0;
    const pct = total > 0 ? (count / total) * 100 : 0;
    return {
      regionName: rd.regionName,
      shortName: getRegionShortName(rd.regionName),
      color: getRegionColor(rd.regionName),
      count,
      total,
      pct,
    };
  });

  return (
    <div className="space-y-3.5">
      {/* Description */}
      <p className="text-[13px] font-medium text-gray-500 sm:text-sm">
        Persentase responden yang menilai crew{" "}
        <span className="font-bold text-gray-800">“{positiveLabel}”</span>
      </p>

      {/* One progress row per region */}
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.regionName} className="flex items-center gap-2.5 sm:gap-3">
            <span
              className="w-[84px] shrink-0 whitespace-nowrap text-right text-[13px] font-bold sm:w-[96px]"
              style={{ color: row.color }}
            >
              {row.shortName}
            </span>
            <div className="h-3.5 flex-1 overflow-hidden rounded-full bg-gray-100/80 sm:h-4">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${Math.max(row.pct, row.count > 0 ? 3 : 0)}%`,
                  backgroundColor: row.color,
                }}
              />
            </div>
            <span className="min-w-[130px] shrink-0 whitespace-nowrap text-right text-[13px] font-bold tabular-nums text-gray-800 sm:min-w-[150px] sm:text-sm">
              {Math.round(row.pct)}%
              <span className="ml-1 text-[13px] font-medium text-gray-400 sm:text-sm">
                ({row.count}/{row.total})
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
