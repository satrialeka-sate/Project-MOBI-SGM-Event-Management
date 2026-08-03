"use client";

import type { AnswerStat } from "@/types/survey";
import type { RegionAnswerData } from "@/components/GroupedBarChart";
import { getRegionColor, getRegionShortName } from "@/constants/region-colors";

// ─── Fixed category palette — represents the PACKAGE category (never the region) ───
const PACKAGE_COLORS: Record<string, string> = {
  "Paket 1": "#10B981", // Green
  "Paket 2": "#2563EB", // Blue
  "Paket 3": "#8B5CF6", // Purple
  "Tidak Membeli": "#EF4444", // Red
};

const FALLBACK_COLOR = "#6B7280";

/** Show the respondent count only when the block is big enough for it. */
const COUNT_MIN_PCT = 22;
/** Very small blocks switch to a single horizontal line of text. */
const COMPACT_MAX_PCT = 12;

interface TreemapItem {
  label: string;
  pct: number;
  count: number;
  color: string;
}

function buildItems(answers: AnswerStat[]): TreemapItem[] {
  return answers
    .filter((a) => a.count > 0)
    .map((a) => ({
      label: a.label,
      pct: Math.round(a.percentage),
      count: a.count,
      color: PACKAGE_COLORS[a.label] ?? FALLBACK_COLOR,
    }))
    .sort((a, b) => b.pct - a.pct);
}

// ─── Single treemap block ─────────────────────────────────────────────
function TreemapBlock({
  item,
  compact,
}: {
  item: TreemapItem;
  compact: boolean;
}) {
  const showCount = !compact && item.pct >= COUNT_MIN_PCT;

  if (compact) {
    return (
      <div
        className="flex h-full w-full items-center justify-center gap-1.5 overflow-hidden rounded-lg px-2 text-center"
        style={{ backgroundColor: item.color }}
      >
        <span className="break-words text-xs font-semibold leading-tight text-white">
          {item.label}
        </span>
        <span className="shrink-0 text-xs font-bold leading-tight text-white tabular-nums">
          {item.pct}%
        </span>
      </div>
    );
  }

  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-0.5 overflow-hidden rounded-lg px-1.5 py-1 text-center transition-all duration-200 hover:brightness-110"
      style={{ backgroundColor: item.color }}
    >
      <span className="break-words text-xs font-semibold leading-tight text-white">
        {item.label}
      </span>
      <span className="text-xs font-bold leading-tight text-white tabular-nums">
        {item.pct}%
      </span>
      {showCount && (
        <span className="text-xs font-medium leading-tight text-white/90 tabular-nums">
          {item.count} responden
        </span>
      )}
    </div>
  );
}

// ─── Single region treemap card ───────────────────────────────────────
function TreemapCard({
  regionName,
  answers,
  index,
}: {
  regionName: string;
  answers: AnswerStat[];
  index: number;
}) {
  const items = buildItems(answers);
  const regionColor = getRegionColor(regionName);

  // Rows: biggest category full-width on top, next two split the middle,
  // smallest full-width at the bottom (matches the reference layout).
  const [A, B, C, D] = items;

  return (
    <div
      className="flex h-full flex-col rounded-[20px] bg-white p-4 shadow-sm ring-1 ring-gray-100 transition-all duration-300 hover:shadow-md animate-[fadeInUp_0.5s_ease-out_backwards] md:p-5"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Region header */}
      <div className="mb-3 flex items-center justify-center gap-2">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: regionColor }}
        />
        <h3 className="text-base font-bold text-gray-900">
          {getRegionShortName(regionName)}
        </h3>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-1 items-center justify-center py-12 text-center">
          <p className="text-sm font-medium text-gray-400">Belum ada data</p>
        </div>
      ) : (
        <div
          className="flex h-56 w-full flex-col gap-1.5 md:h-64"
          role="img"
          aria-label={`Komposisi paket ${getRegionShortName(regionName)}`}
        >
          {/* Row 1: largest category — full width */}
          {A && (
            <div className="flex w-full" style={{ flexGrow: Math.max(A.pct, 1) }}>
              <TreemapBlock item={A} compact={A.pct < COMPACT_MAX_PCT} />
            </div>
          )}

          {/* Row 2: third exists → split B|C, otherwise B full-width */}
          {C ? (
            <div
              className="flex w-full"
              style={{ flexGrow: Math.max(B?.pct ?? 1, 1) + Math.max(C.pct, 1) }}
            >
              <div className="flex h-full w-full gap-1.5">
                {B && (
                  <div className="flex" style={{ flexGrow: Math.max(B.pct, 1) }}>
                    <TreemapBlock item={B} compact={B.pct < COMPACT_MAX_PCT} />
                  </div>
                )}
                <div className="flex" style={{ flexGrow: Math.max(C.pct, 1) }}>
                  <TreemapBlock item={C} compact={C.pct < COMPACT_MAX_PCT} />
                </div>
              </div>
            </div>
          ) : B ? (
            <div className="flex w-full" style={{ flexGrow: Math.max(B.pct, 1) }}>
              <TreemapBlock item={B} compact={B.pct < COMPACT_MAX_PCT} />
            </div>
          ) : null}

          {/* Row 3: smallest category — full width */}
          {D && (
            <div className="flex w-full" style={{ flexGrow: Math.max(D.pct, 1) }}>
              <TreemapBlock item={D} compact={D.pct < COMPACT_MAX_PCT} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Grid: 1 column mobile → 2 columns tablet & desktop ───────────────
export function PackageTreemapGrid({
  regionsData,
}: {
  regionsData: RegionAnswerData[];
}) {
  return (
    <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2">
      {regionsData.map((rd, idx) => (
        <TreemapCard
          key={rd.regionName}
          regionName={rd.regionName}
          answers={rd.answers}
          index={idx}
        />
      ))}
    </div>
  );
}
