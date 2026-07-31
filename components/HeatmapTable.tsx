"use client";

import {
  hasAnyData,
  type RegionAnswerData,
} from "@/components/GroupedBarChart";
import {
  getRegionColor,
  getRegionShortName,
} from "@/constants/region-colors";

// ─── Helpers ───────────────────────────────────────────────────────────

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Union of answer labels across regions (sorted by total count desc) */
function collectLabels(regionsData: RegionAnswerData[]): string[] {
  const totals = new Map<string, number>();
  for (const rd of regionsData) {
    for (const a of rd.answers) {
      totals.set(a.label, (totals.get(a.label) ?? 0) + a.count);
    }
  }
  return [...totals.entries()]
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([label]) => label);
}

// ═══════════════════════════════════════════════════════════════════════
// HEATMAP TABLE — Kesan Event (memorableImpression)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Region × category heatmap. Columns are regions (JABAR → JATENG → JATIM →
 * ALL REGION), rows are answer categories. Each cell uses the region's color
 * with intensity scaled by percentage so the dominant category pops
 * immediately — no legend re-reading needed.
 */
export function HeatmapTable({ regionsData }: { regionsData: RegionAnswerData[] }) {
  if (!hasAnyData(regionsData)) {
    return (
      <div className="flex h-32 items-center justify-center rounded-xl bg-gray-50 text-sm text-gray-400">
        Belum ada data
      </div>
    );
  }

  const labels = collectLabels(regionsData);

  // Per-region max percentage so every column's dominant category pops
  // (a uniformly low region still shows clear contrast internally).
  const maxPctByRegion = new Map<string, number>();
  for (const rd of regionsData) {
    maxPctByRegion.set(
      rd.regionName,
      Math.max(1, ...rd.answers.map((a) => a.percentage)),
    );
  }

  return (
    <div className="w-full overflow-x-auto pb-1">
      <div className="min-w-[420px]">
        {/* Header row — region columns */}
        <div
          className="mb-1.5 grid gap-1.5"
          style={{
            gridTemplateColumns: `minmax(120px, 1.3fr) repeat(${regionsData.length}, minmax(60px, 1fr))`,
          }}
        >
          <div className="px-1 text-[13px] font-bold uppercase tracking-wider text-gray-400">
            Kategori
          </div>
          {regionsData.map((rd) => (
            <div
              key={rd.regionName}
              className="flex items-center justify-center gap-1.5 px-1"
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: getRegionColor(rd.regionName) }}
              />
              <span
                className="whitespace-nowrap text-[13px] font-bold"
                style={{ color: getRegionColor(rd.regionName) }}
              >
                {getRegionShortName(rd.regionName)}
              </span>
            </div>
          ))}
        </div>

        {/* Rows */}
        <div className="space-y-1.5">
          {labels.map((label) => (
            <div
              key={label}
              className="grid gap-1.5"
              style={{
                gridTemplateColumns: `minmax(120px, 1.3fr) repeat(${regionsData.length}, minmax(60px, 1fr))`,
              }}
            >
              {/* Category label — full, never truncated */}
              <div className="flex items-center px-1">
                <span className="whitespace-normal break-words text-[13px] font-semibold leading-snug text-gray-800">
                  {label}
                </span>
              </div>

              {/* Cells */}
              {regionsData.map((rd) => {
                const answer = rd.answers.find((a) => a.label === label);
                const pct = answer?.percentage ?? 0;
                const count = answer?.count ?? 0;
                const color = getRegionColor(rd.regionName);

                // No data for this category in this region — render an empty cell
                if (count === 0) {
                  return (
                    <div
                      key={rd.regionName}
                      className="flex min-h-[44px] items-center justify-center rounded-lg bg-gray-50/80 ring-1 ring-gray-100/60"
                      aria-label={`${label} — ${getRegionShortName(rd.regionName)}: tidak ada data`}
                    >
                      <span className="text-[13px] text-gray-300">—</span>
                    </div>
                  );
                }

                // Intensity scales with percentage relative to the region's own max
                const regionMax = maxPctByRegion.get(rd.regionName) ?? 100;
                const alpha = 0.12 + (pct / regionMax) * 0.8;
                const bg = hexToRgba(color, alpha);
                const darkText = alpha < 0.42;

                return (
                  <div
                    key={rd.regionName}
                    className="flex min-h-[44px] flex-col items-center justify-center rounded-lg px-1 py-1.5 text-center transition-all duration-200 hover:scale-[1.03] hover:shadow-sm"
                    style={{ backgroundColor: bg }}
                    title={`${label} — ${getRegionShortName(rd.regionName)}: ${count} (${Math.round(pct)}%)`}
                  >
                    <span
                      className={`text-sm font-extrabold leading-none tabular-nums sm:text-base ${
                        darkText ? "text-gray-800" : "text-white"
                      }`}
                    >
                      {Math.round(pct)}%
                    </span>
                    <span
                      className={`mt-0.5 text-[13px] font-medium leading-none tabular-nums ${
                        darkText ? "text-gray-500" : "text-white/85"
                      }`}
                    >
                      {count} resp
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
