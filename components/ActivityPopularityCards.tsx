"use client";

import type { AnswerStat } from "@/types/survey";
import type { RegionAnswerData } from "@/components/GroupedBarChart";
import { getRegionColor, getRegionShortName } from "@/constants/region-colors";
import { useMountAnimation } from "@/hooks/use-mount-animation";

// ─── Animated circular progress (region-colored) ──────────────────────
function CircularProgress({
  percentage,
  color,
  animated,
  size = 128,
  strokeWidth = 10,
}: {
  percentage: number;
  color: string;
  animated: boolean;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const center = size / 2;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="drop-shadow-sm" aria-hidden="true">
        {/* Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#f3f4f6"
          strokeWidth={strokeWidth}
        />
        {/* Progress — animates from empty to final on mount */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animated ? offset : circumference}
          transform={`rotate(-90 ${center} ${center})`}
          className="transition-[stroke-dashoffset] duration-1000 ease-out"
        />
      </svg>
      {/* Percentage label */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold leading-none text-gray-900 tabular-nums">
          {percentage}%
        </span>
      </div>
    </div>
  );
}

// ─── Single region popularity card ────────────────────────────────────
function RegionCard({
  regionName,
  answers,
  index,
}: {
  regionName: string;
  answers: AnswerStat[];
  index: number;
}) {
  const color = getRegionColor(regionName);

  // Animations run once on first render (circular progress + bars)
  const animated = useMountAnimation();

  const ranked = answers
    .filter((a) => a.count > 0)
    .sort((a, b) => b.count - a.count);
  const total = answers.reduce((sum, a) => sum + a.count, 0);
  const top = ranked[0];

  return (
    <div
      className="relative flex h-full flex-col overflow-hidden rounded-[20px] bg-white p-5 shadow-sm ring-1 ring-gray-100 transition-all duration-300 hover:shadow-md animate-[fadeInUp_0.5s_ease-out_backwards]"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Region-colored accent bar */}
      <div
        className="absolute inset-x-5 top-0 h-1 rounded-b-full"
        style={{ backgroundColor: color, opacity: 0.85 }}
      />

      {/* Region header */}
      <div className="mb-4 flex items-center justify-center gap-2">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
        />
        <h3 className="text-base font-bold text-gray-900">
          {getRegionShortName(regionName)}
        </h3>
      </div>

      {total > 0 && top ? (
        <>
          {/* Circular progress + top activity */}
          <div className="flex flex-col items-center">
            <CircularProgress
              percentage={Math.round(top.percentage)}
              color={color}
              animated={animated}
            />

            <p className="mt-4 break-words whitespace-normal text-center text-base font-semibold leading-snug text-gray-800">
              {top.label}
            </p>
            <p className="mt-1 text-[13px] text-gray-500 tabular-nums">
              {top.value} responden
            </p>
          </div>

          {/* Full ranking */}
          <div className="mt-5 flex-1 space-y-3 border-t border-gray-100 pt-4">
            {ranked.map((item, idx) => {
              const pct = Math.round(item.percentage);
              const barWidth = Math.max(pct, item.count > 0 ? 2 : 0);

              return (
                <div key={item.label} className="flex items-center gap-2.5">
                  <span className="w-5 shrink-0 text-sm font-semibold tabular-nums text-gray-400">
                    {idx + 1}.
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="min-w-0 break-words whitespace-normal text-sm font-medium leading-snug text-gray-700">
                        {item.label}
                      </span>
                      <span className="shrink-0 text-sm font-bold tabular-nums text-gray-900">
                        {pct}%
                      </span>
                    </div>
                    {/* Small horizontal bar — animates on mount */}
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full transition-[width] duration-1000 ease-out"
                        style={{
                          width: animated ? `${barWidth}%` : "0%",
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* Empty state — region without any survey data */
        <div className="flex flex-1 items-center justify-center py-12 text-center">
          <p className="text-sm font-medium text-gray-400">Belum ada data</p>
        </div>
      )}
    </div>
  );
}

// ─── Grid: 1 column mobile → 2 columns tablet & desktop ───────────────
export function ActivityPopularityCards({
  regionsData,
}: {
  regionsData: RegionAnswerData[];
}) {
  return (
    <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2">
      {regionsData.map((rd, idx) => (
        <RegionCard
          key={rd.regionName}
          regionName={rd.regionName}
          answers={rd.answers}
          index={idx}
        />
      ))}
    </div>
  );
}
