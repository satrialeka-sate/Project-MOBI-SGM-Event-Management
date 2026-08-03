"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { AnswerStat } from "@/types/survey";
import type { RegionAnswerData } from "@/components/GroupedBarChart";
import { getRegionShortName } from "@/constants/region-colors";

// ─── Fixed category palette ────────────────────────────────────────────
// Colors represent the PROFESSION CATEGORY (never the region) so clients
// instantly recognize each color across the whole page.
const PROFESSION_COLORS: Record<string, string> = {
  "Ibu Rumah Tangga": "#2563EB", // Blue
  "Wirausaha / UMKM": "#F59E0B", // Orange
  Profesional: "#10B981", // Green
  Pekerja: "#EF4444", // Red
};

const FALLBACK_COLOR = "#6B7280";

/** Fixed legend order — keeps pie segments and legend in the same order */
const CATEGORY_ORDER = [
  "Ibu Rumah Tangga",
  "Wirausaha / UMKM",
  "Profesional",
  "Pekerja",
];

interface DonutItem {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

function buildDonut(answers: AnswerStat[]): {
  items: DonutItem[];
  total: number;
} {
  const total = answers.reduce((sum, a) => sum + a.count, 0);
  const byLabel = new Map(answers.map((a) => [a.label, a]));

  const items: DonutItem[] = CATEGORY_ORDER.map((label) => {
    const answer = byLabel.get(label);
    const count = answer?.count ?? 0;
    return {
      name: label,
      value: count,
      // Guard against a stale non-zero percentage when count is 0
      percentage: count > 0 ? answer?.percentage ?? 0 : 0,
      color: PROFESSION_COLORS[label] ?? FALLBACK_COLOR,
    };
  });

  return { items, total };
}

// ─── Custom tooltip: category + count + percentage ────────────────────
interface DonutTooltipProps {
  active?: boolean;
  payload?: { payload: DonutItem }[];
}

function DonutTooltip({ active, payload }: DonutTooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload as DonutItem;

  return (
    <div className="rounded-xl border border-gray-100 bg-white/95 px-3.5 py-2.5 shadow-lg backdrop-blur-sm">
      <p className="mb-1 text-xs font-semibold text-gray-800">{item.name}</p>
      <p className="text-sm font-bold tabular-nums" style={{ color: item.color }}>
        {item.value} responden · {Math.round(item.percentage)}%
      </p>
    </div>
  );
}

// ─── Single region donut card ─────────────────────────────────────────
function DonutCard({
  regionName,
  answers,
}: {
  regionName: string;
  answers: AnswerStat[];
}) {
  const { items, total } = useMemo(() => buildDonut(answers), [answers]);
  const majority = items.reduce(
    (best, item) => (item.value > best.value ? item : best),
    items[0],
  );
  const hasData = total > 0;
  const segments = items.filter((i) => i.value > 0);

  return (
    <div className="flex h-full flex-col rounded-[18px] bg-white p-4 shadow-sm ring-1 ring-gray-100 transition-all duration-300 hover:shadow-md md:rounded-[20px] md:p-5">
      {/* Region title */}
      <h4 className="mb-3 text-center text-sm font-bold text-gray-900 md:mb-4 md:text-[15px]">
        {getRegionShortName(regionName)}
      </h4>

      {hasData ? (
        <>
          {/* Donut + center total */}
          <div
            className="relative mx-auto min-h-[150px] w-full max-w-[200px] flex-1"
            role="img"
            aria-label={`Distribusi profesi ${getRegionShortName(regionName)} — ${total} responden`}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={segments}
                  cx="50%"
                  cy="50%"
                  innerRadius="64%"
                  outerRadius="90%"
                  dataKey="value"
                  paddingAngle={2}
                  cornerRadius={4}
                  stroke="#ffffff"
                  strokeWidth={1.5}
                  animationDuration={900}
                  animationEasing="ease-out"
                >
                  {segments.map((item) => (
                    <Cell key={item.name} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip content={<DonutTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Center label — total respondents */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-extrabold leading-none text-gray-900 tabular-nums md:text-[26px]">
                {total}
              </span>
              <span className="mt-1 text-xs font-medium text-gray-500">
                Responden
              </span>
            </div>
          </div>

          {/* Full legend — all categories, labels wrap when needed */}
          <div className="mt-4 space-y-1.5 md:mt-5">
            {items.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between gap-2"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="min-w-0 break-words text-xs font-medium leading-snug text-gray-700">
                    {item.name}
                  </span>
                </div>
                <span className="shrink-0 text-xs font-bold tabular-nums text-gray-900">
                  {Math.round(item.percentage)}%
                </span>
              </div>
            ))}
          </div>

          {/* Majority highlight */}
          <p className="mt-3 border-t border-gray-100 pt-2.5 text-xs font-semibold text-gray-800">
            Mayoritas:{" "}
            <span className="font-bold" style={{ color: majority.color }}>
              {majority.name}
            </span>{" "}
            <span className="font-bold tabular-nums" style={{ color: majority.color }}>
              ({Math.round(majority.percentage)}%)
            </span>
          </p>
        </>
      ) : (
        /* Empty state — region without any survey data */
        <div className="flex flex-1 items-center justify-center py-12 text-center">
          <p className="text-xs font-medium text-gray-400">Belum ada data</p>
        </div>
      )}
    </div>
  );
}

// ─── Grid: 2 columns mobile → 4 columns desktop ───────────────────────
export function ProfessionDonutGrid({
  regionsData,
}: {
  regionsData: RegionAnswerData[];
}) {
  return (
    <div className="grid grid-cols-2 items-stretch gap-3 md:gap-4 lg:grid-cols-4">
      {regionsData.map((rd) => (
        <DonutCard
          key={rd.regionName}
          regionName={rd.regionName}
          answers={rd.answers}
        />
      ))}
    </div>
  );
}
