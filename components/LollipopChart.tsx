"use client";

import type { RegionAnswerData } from "@/components/GroupedBarChart";
import { getRegionColor, getRegionShortName } from "@/constants/region-colors";
import { useMountAnimation } from "@/hooks/use-mount-animation";

// ─── Horizontal Lollipop Chart ────────────────────────────────────────
// One section per category; each section has one row per region:
//   region name (left) · thin line + circle (center) · percentage (right)
export function LollipopChart({
  regionsData,
}: {
  regionsData: RegionAnswerData[];
}) {
  const animated = useMountAnimation();

  // Unique category labels that have data in at least one region,
  // in order of appearance (dominant categories of the first region first)
  const labels = Array.from(
    new Set(
      regionsData.flatMap((rd) =>
        rd.answers.filter((a) => a.count > 0).map((a) => a.label),
      ),
    ),
  );

  if (labels.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-xl bg-gray-50 text-sm text-gray-400">
        Belum ada data
      </div>
    );
  }

  return (
    <div
      className="w-full animate-[fadeInUp_0.5s_ease-out_backwards]"
      style={{ animationDelay: "60ms" }}
    >
      <div className="space-y-6">
        {labels.map((label) => (
          <div key={label} className="min-w-0">
            {/* Category label */}
            <p className="mb-2.5 whitespace-normal break-words text-[13px] font-bold leading-snug text-gray-800 sm:text-sm">
              {label}
            </p>

            {/* One lollipop row per region (~26–28px tall) */}
            <div className="space-y-2">
              {regionsData.map((rd) => {
                const answer = rd.answers.find((a) => a.label === label);
                const count = answer?.count ?? 0;
                const pct = count > 0 ? Math.round(answer?.percentage ?? 0) : 0;
                const endPct = Math.max(pct, count > 0 ? 2 : 0);
                const color = getRegionColor(rd.regionName);

                return (
                  <div
                    key={rd.regionName}
                    className="flex h-[26px] items-center gap-2 sm:h-[28px]"
                  >
                    {/* Region name */}
                    <span
                      className="w-[76px] shrink-0 whitespace-normal text-right text-[12px] font-bold leading-tight sm:w-[92px] sm:text-[13px]"
                      style={{ color }}
                    >
                      {getRegionShortName(rd.regionName)}
                    </span>

                    {/* Lollipop track */}
                    <div className="relative h-[26px] flex-1 sm:h-[28px]">
                      {/* Thin gray baseline */}
                      <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-gray-100" />

                      {/* Colored line — grows from left on mount */}
                      <div
                        className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full"
                        style={{
                          width: animated ? `${endPct}%` : "0%",
                          backgroundColor: color,
                          transition: "width 900ms ease-out",
                        }}
                      />

                      {/* Circle at the end of the line — pops in */}
                      <div
                        className="absolute top-1/2 h-3.5 w-3.5 rounded-full border-2 border-white shadow-sm"
                        style={{
                          left: `${endPct}%`,
                          backgroundColor: color,
                          opacity: animated && count > 0 ? 1 : 0,
                          transform: `translate(-50%, -50%) scale(${
                            animated && count > 0 ? 1 : 0
                          })`,
                          transition: "opacity 500ms ease-out, transform 700ms ease-out",
                        }}
                      />
                    </div>

                    {/* Percentage */}
                    <span className="w-[48px] shrink-0 text-right text-[13px] font-bold tabular-nums text-gray-800 sm:w-[56px] sm:text-sm">
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
