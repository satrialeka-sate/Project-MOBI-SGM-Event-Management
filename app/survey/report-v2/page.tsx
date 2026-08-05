"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useQueries } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Loader2, ArrowLeft, Users, Brain,
  Sparkles, Lightbulb, Clock, Filter, Activity,
  ShoppingBag, AlertTriangle, Target, UserCheck,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import ErrorState from "@/components/ErrorState";
import { VersionSwitcher } from "@/components/VersionSwitcher";
import { usePermissions } from "@/hooks/use-permissions";
import { surveyApi } from "@/lib/api/survey";
import {
  useQuestionAiAnalyses,
  useGenerateQuestionAiAnalyses,
} from "@/hooks/use-survey";
import { useRegions } from "@/hooks/use-regions";
import { useEvents } from "@/hooks/use-events";
import type { SurveyReport, QuestionStat } from "@/types/survey";
import type { SurveyQuestionAiAnalysis } from "@/types/survey-ai";
import type { DateRange } from "@/components/ui/date-range-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  GroupedBarChart,
  buildComparisonData,
} from "@/components/GroupedBarChart";
import {
  hasAnyData,
  type RegionDef,
  type RegionAnswerData,
} from "@/components/GroupedBarChart";
import { HeatmapTable } from "@/components/HeatmapTable";
import { CrewProgressCard } from "@/components/CrewProgressCard";
import { ProfessionDonutGrid } from "@/components/ProfessionDonutGrid";
import { ActivityPopularityCards } from "@/components/ActivityPopularityCards";
import { LollipopChart } from "@/components/LollipopChart";
import { PackageTreemapGrid } from "@/components/PackageTreemapGrid";
import {
  getRegionColor,
  getRegionShortName,
  sortRegionsByName,
} from "@/constants/region-colors";

// ─── Constants ─────────────────────────────────────────────────────────

const ALL_REGION_NAME = "ALL REGION";

/** Crew impression positive label used for the gauge chart */
const CREW_POSITIVE_LABEL = "Menyenangkan dan Ramah";

/* ─── Survey question config ─────────────────────────────────────── */
type ChartType =
  | "bar"
  | "heatmap"
  | "progress"
  | "donut"
  | "popularity"
  | "lollipop"
  | "treemap";

const QUESTIONS: {
  key: string;
  label: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  chart: ChartType;
}[] = [
  {
    key: "profession",
    label: "Profesi Responden",
    icon: Users,
    iconColor: "text-red-500",
    iconBg: "bg-red-50",
    chart: "donut",
  },
  {
    key: "notBuyingReason",
    label: "Alasan Tidak Membeli",
    icon: AlertTriangle,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-50",
    chart: "bar",
  },
  {
    key: "buyingReason",
    label: "Alasan Membeli",
    icon: ShoppingBag,
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-50",
    chart: "lollipop",
  },
  {
    key: "package",
    label: "Paket yang Dibeli",
    icon: Target,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-50",
    chart: "treemap",
  },
  {
    key: "favoriteActivity",
    label: "Aktivitas Favorit",
    icon: Activity,
    iconColor: "text-purple-500",
    iconBg: "bg-purple-50",
    chart: "popularity",
  },
  {
    key: "memorableImpression",
    label: "Kesan yang Paling Diingat",
    icon: Lightbulb,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-50",
    chart: "heatmap",
  },
  {
    key: "crewImpression",
    label: "Crew Impression",
    icon: UserCheck,
    iconColor: "text-cyan-500",
    iconBg: "bg-cyan-50",
    chart: "progress",
  },
];

// ─── Helpers ───────────────────────────────────────────────────────────

function formatShortDate(d: Date): string {
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function toISODateString(d: Date): string {
  return d.toISOString().split("T")[0];
}

function formatAiDateTime(iso: string): string {
  if (!iso) return "-";
  const d = new Date(iso);
  const date = d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${date} • ${hh}:${mm} WIB`;
}

function findQuestion(
  report: SurveyReport,
  key: string
): QuestionStat | undefined {
  return report.questions.find((q) => q.questionKey === key);
}

function buildRegionsDataForQuestion(
  questionKey: string,
  regionReports: {
    region: { id: string; name: string };
    report: SurveyReport | null;
  }[],
  allRegionReport: SurveyReport | null
): RegionAnswerData[] {
  return [
    ...regionReports
      .filter((rr) => rr.report)
      .map((rr) => ({
        regionName: rr.region.name,
        answers: findQuestion(rr.report!, questionKey)?.answers ?? [],
      })),
    ...(allRegionReport
      ? [
          {
            regionName: ALL_REGION_NAME,
            answers: findQuestion(allRegionReport, questionKey)?.answers ?? [],
          },
        ]
      : []),
  ];
}

// ═══════════════════════════════════════════════════════════════════════
// PER-QUESTION AI QUALITATIVE ANALYSIS CARD
// ═══════════════════════════════════════════════════════════════════════

function QuestionAiCard({
  analysis,
  isLoading,
}: {
  analysis: SurveyQuestionAiAnalysis | null | undefined;
  isLoading: boolean;
}) {
  // ── Loading skeleton ──
  if (isLoading) {
    return (
      <div className="mt-4 animate-pulse rounded-2xl bg-gray-50 p-4 ring-1 ring-gray-100/60">
        <div className="mb-2 h-3 w-40 rounded bg-gray-200" />
        <div className="space-y-2">
          <div className="h-3 w-full rounded bg-gray-100" />
          <div className="h-3 w-11/12 rounded bg-gray-100" />
          <div className="h-3 w-4/6 rounded bg-gray-100" />
        </div>
      </div>
    );
  }

  // ── Empty state ──
  if (!analysis) {
    return (
      <div className="mt-4 rounded-2xl bg-gray-50/80 px-4 py-3.5 ring-1 ring-gray-100/60">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-violet-400" />
          <span className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
            Analisa Kualitatif AI
          </span>
        </div>
        <p className="mt-1.5 text-xs text-gray-400">
          Analisa AI belum tersedia untuk pertanyaan ini. Klik{" "}
          <span className="font-medium text-gray-500">Generate Semua Analisa AI</span>{" "}
          di atas untuk membuatnya.
        </p>
      </div>
    );
  }

  // ── Analysis card ──
  return (
    <div className="mt-4 rounded-2xl bg-gray-50/90 px-4 py-3.5 shadow-sm ring-1 ring-gray-100/60 md:px-5 md:py-4">
      <div className="mb-1.5 flex items-center gap-1.5">
        <Sparkles className="h-3.5 w-3.5 text-violet-500" />
        <span className="text-[11px] font-bold uppercase tracking-wide text-gray-600">
          Analisa Kualitatif AI
        </span>
      </div>
      <p className="text-sm leading-relaxed text-gray-700">{analysis.analysis}</p>
      <div className="mt-2.5 flex items-center gap-1.5 border-t border-gray-200/70 pt-2 text-[11px] text-gray-400">
        <Clock className="h-3 w-3" />
        Last AI Analysis: {formatAiDateTime(analysis.generatedAt)}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// QUESTION SECTION
// ═══════════════════════════════════════════════════════════════════════

function QuestionSection({
  number,
  title,
  icon: Icon,
  iconBg,
  iconColor,
  children,
}: {
  number: string;
  title: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 transition-all duration-300 hover:shadow-md md:p-6">
      {/* Section header */}
      <div className="mb-4 flex items-start gap-3 md:mb-5">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
        >
          <Icon className={`h-4.5 w-4.5 ${iconColor}`} />
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-bold text-gray-900 leading-snug md:text-lg">
            <span className="mr-1.5 font-semibold text-gray-400">{number}.</span>
            {title}
          </h3>
        </div>
      </div>

      {/* Chart + AI analysis */}
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// HEADER — matches V1 style with SGM logo
// ═══════════════════════════════════════════════════════════════════════

function PageHeader() {
  return (
    <div className="mb-4 md:mb-6">
      {/* SGM Logo — same as V1 */}
      <div className="flex flex-col items-center justify-center">
        <div className="group mb-1.5">
          <div className="relative animate-[fadeInUp_0.6s_ease-out] rounded-2xl p-1 transition-all duration-500 ease-out group-hover:bg-sgm-red-light/40 group-hover:shadow-lg">
            <img
              src="/SGM_logo.svg"
              alt="SGM"
              className="h-10 w-auto transition-all duration-500 ease-out md:h-14 hover:scale-110 hover:brightness-110 hover:drop-shadow-xl active:scale-95"
            />
            <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-transparent transition-all duration-500 ease-out group-hover:ring-sgm-red/20 group-hover:ring-2" />
          </div>
        </div>

        <h1 className="text-center text-[22px] font-extrabold text-[#111827] leading-[1.1] whitespace-nowrap w-fit mx-auto sm:text-2xl md:text-[40px] lg:text-5xl">
          Survey Results Comparison
        </h1>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// INFO HEADER
// ═══════════════════════════════════════════════════════════════════════

function InfoHeader({
  selectedRegionId,
  selectedVenueName,
  dateRange,
  regions,
}: {
  selectedRegionId: string;
  selectedVenueName: string;
  dateRange: DateRange;
  regions: { id: string; name: string }[] | undefined;
}) {
  const regionLabel = selectedRegionId
    ? regions?.find((r) => r.id === selectedRegionId)?.name || selectedRegionId
    : "All Region";

  const venueLabel = selectedVenueName || "All Venue";

  const periodLabel = dateRange.from
    ? `${formatShortDate(dateRange.from)}${dateRange.to ? ` - ${formatShortDate(dateRange.to)}` : ""}`
    : "All Period";

  return (
    <div className="rounded-xl bg-white px-5 py-3.5 shadow-sm ring-1 ring-gray-100 md:px-6 md:py-4">
      <div className="space-y-3">
        <div className="flex justify-between items-start w-full">
          <div className="flex flex-col gap-0.5 text-left">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Region :</span>
            <span className="text-[13px] font-medium text-[#111827] leading-[1.4] break-words whitespace-normal">{regionLabel}</span>
          </div>
          <div className="flex flex-col gap-0.5 text-right">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Period :</span>
            <span className="text-[13px] font-medium text-[#111827] leading-[1.4] break-words whitespace-normal">{periodLabel}</span>
          </div>
        </div>
        <div className="flex flex-col gap-0.5 text-left">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Venue :</span>
          <span className="text-[13px] font-medium text-[#111827] leading-[1.4] break-words whitespace-normal">{venueLabel}</span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// FILTER BAR
// ═══════════════════════════════════════════════════════════════════════

function FilterBar({
  venues,
  regions,
  selectedVenueId,
  selectedRegionId,
  dateRange,
  onVenueChange,
  onRegionChange,
  onDateRangeChange,
}: {
  venues: { id: string; venueName: string; regionId: string }[];
  regions: { id: string; name: string }[] | undefined;
  selectedVenueId: string;
  selectedRegionId: string;
  dateRange: DateRange;
  onVenueChange: (val: string) => void;
  onRegionChange: (val: string) => void;
  onDateRangeChange: (range: DateRange) => void;
}) {
  const filteredVenues = selectedRegionId
    ? venues.filter((v) => v.regionId === selectedRegionId)
    : venues;

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100 md:p-5">
      <div className="mb-3 flex items-center gap-2">
        <Filter className="h-4 w-4 text-gray-400" />
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Filter Data</span>
      </div>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-gray-500">Region</label>
            <select
              value={selectedRegionId}
              onChange={(e) => onRegionChange(e.target.value)}
              className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-700 shadow-sm outline-none transition-all hover:border-gray-300 focus:border-sgm-red focus:ring-2 focus:ring-sgm-red/20 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239CA3AF%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[right_12px_center] bg-no-repeat pr-10"
            >
              <option value="">All Region</option>
              {regions?.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-gray-500">Venue</label>
            <select
              value={selectedVenueId}
              onChange={(e) => onVenueChange(e.target.value)}
              className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-700 shadow-sm outline-none transition-all hover:border-gray-300 focus:border-sgm-red focus:ring-2 focus:ring-sgm-red/20 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239CA3AF%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[right_12px_center] bg-no-repeat pr-10"
            >
              <option value="">All Venue</option>
              {filteredVenues.map((v) => (
                <option key={v.id} value={v.id}>{v.venueName}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] font-medium text-gray-500">Period</label>
          <DateRangePicker
            value={dateRange}
            onChange={onDateRangeChange}
            placeholder="All Period"
          />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// AI GENERATION TOOLBAR
// ═══════════════════════════════════════════════════════════════════════

function AiGenerationBar({
  canGenerateAi,
  isGeneratingAi,
  hasAnyAnalysis,
  handleGenerateAi,
}: {
  canGenerateAi: boolean;
  isGeneratingAi: boolean;
  hasAnyAnalysis: boolean;
  handleGenerateAi: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:flex-row sm:items-center sm:justify-between md:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-sm">
          <Brain className="h-4.5 w-4.5 text-white" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-gray-900">
            Analisa Kualitatif AI per Pertanyaan
          </h3>
          <p className="mt-0.5 text-[11px] leading-5 text-gray-400 md:text-xs">
            Setiap pertanyaan memiliki analisa AI sendiri — membandingkan JABAR, JATENG,
            JATIM, dan ALL REGION. {hasAnyAnalysis && "Analisa lama akan diperbarui saat generate ulang."}
          </p>
        </div>
      </div>
      {canGenerateAi && (
        <Button
          variant="default"
          size="default"
          onClick={handleGenerateAi}
          disabled={isGeneratingAi}
          className="w-full shrink-0 sm:w-auto"
        >
          {isGeneratingAi ? (
            <>
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              Menganalisis...
            </>
          ) : (
            <>
              <Sparkles className="mr-1.5 h-4 w-4" />
              Generate Semua Analisa AI
            </>
          )}
        </Button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// LOADING SKELETON
// ═══════════════════════════════════════════════════════════════════════

function ReportSkeleton() {
  return (
    <div className="animate-pulse space-y-4 md:space-y-6">
      {/* Header */}
      <div className="h-10 w-72 rounded-lg bg-gray-100 md:h-12" />
      <div className="h-4 w-48 rounded bg-gray-100" />

      {/* Info header */}
      <div className="h-24 rounded-xl bg-gray-100" />

      {/* Filter */}
      <div className="h-[180px] rounded-xl bg-gray-100 md:h-[120px]" />

      {/* AI toolbar */}
      <div className="h-20 rounded-2xl bg-gray-100" />

      {/* Question sections — single column */}
      <div className="space-y-4">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="h-[420px] rounded-2xl bg-gray-100" />
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════

export default function SurveyReportV2Page() {
  const router = useRouter();
  const { data: session } = useSession();
  const { canReadSurvey, canReadSurveyRegion, canReadSurveyAll } = usePermissions();
  const generateQuestionsAi = useGenerateQuestionAiAnalyses();

  // ── Filters ──────────────────────────────────────────────────────────
  const [selectedRegionId, setSelectedRegionId] = useState("");
  const [selectedVenueId, setSelectedVenueId] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });

  // ── Data: Regions & Events ───────────────────────────────────────────
  const { data: regions, isLoading: regionsLoading } = useRegions();
  const { data: eventsData, isLoading: eventsLoading } = useEvents({
    limit: 1000,
  });

  // Extract venues from events
  const venues = useMemo(() => {
    if (!eventsData?.items) return [];
    return eventsData.items.map((ev) => ({
      id: ev.id,
      venueName: ev.venueName,
      regionId: ev.regionId,
    }));
  }, [eventsData]);

  // Sort regions so colors map to the FIXED palette (JABAR → JATENG → JATIM)
  const sortedRegions = useMemo(() => {
    if (!regions || regions.length === 0) return [];
    return sortRegionsByName(regions);
  }, [regions]);

  // Build region definitions for chart colors — fixed palette by region name
  const regionDefs: RegionDef[] = useMemo(() => {
    const defs = sortedRegions.map((r) => ({
      id: r.id,
      name: r.name,
      shortName: getRegionShortName(r.name),
      color: getRegionColor(r.name),
    }));
    // ALL REGION summary goes last
    defs.push({
      id: "all",
      name: ALL_REGION_NAME,
      shortName: ALL_REGION_NAME,
      color: getRegionColor(ALL_REGION_NAME),
    });
    return defs;
  }, [sortedRegions]);

  // ── Data: Per-region + ALL REGION Survey Reports via useQueries ─────
  const queryParams = useMemo(() => {
    const params: {
      regionId?: string;
      startDate?: string;
      endDate?: string;
      eventId?: string;
    } = {};

    if (dateRange.from) {
      params.startDate = toISODateString(dateRange.from);
    }
    if (dateRange.to) {
      params.endDate = toISODateString(dateRange.to);
    }
    if (selectedVenueId) {
      params.eventId = selectedVenueId;
    }

    return params;
  }, [dateRange, selectedVenueId]);

  // Region queries + one ALL REGION query (last)
  const regionQueryConfigs = useMemo(() => {
    const configs = sortedRegions.map((region) => {
      const p = { ...queryParams };
      if (!selectedVenueId) {
        p.regionId = region.id;
      }
      return {
        queryKey: ["survey-report-v2", region.id, p],
        queryFn: () => surveyApi.getReport(p),
        enabled: !!canReadSurvey,
        staleTime: 5 * 60 * 1000,
      };
    });

    // ALL REGION summary — query without regionId
    configs.push({
      queryKey: ["survey-report-v2", "ALL", queryParams],
      queryFn: () => surveyApi.getReport(queryParams),
      enabled: !!canReadSurvey,
      staleTime: 5 * 60 * 1000,
    });

    return configs;
  }, [sortedRegions, queryParams, selectedVenueId, canReadSurvey]);

  const reportResults = useQueries({
    queries: regionQueryConfigs,
  });

  // Attach region info to each result
  const regionReports = useMemo(() => {
    return sortedRegions.map((region, idx) => {
      const q = reportResults[idx];
      return {
        region,
        report: q?.data ?? null,
        isLoading: q?.isLoading ?? false,
        isError: q?.isError ?? false,
      };
    });
  }, [sortedRegions, reportResults]);

  const allRegionReport = reportResults[sortedRegions.length]?.data ?? null;

  const isReportLoading = regionReports.some((r) => r.isLoading);
  const isReportError = regionReports.some((r) => r.isError);

  // Visible sections only (skip questions without any data), numbered sequentially.
  // The crew impression (progress) section is ALWAYS shown so its empty state
  // message can display when there is not enough data.
  const visibleSections = useMemo(() => {
    return QUESTIONS.map((q) => ({
      q,
      regionsData: buildRegionsDataForQuestion(q.key, regionReports, allRegionReport),
    })).filter((s) => s.q.chart === "progress" || hasAnyData(s.regionsData));
  }, [regionReports, allRegionReport]);

  // ── Per-question AI Analysis ─────────────────────────────────────────
  const aiFilterParams = useMemo(
    () => ({
      eventId: selectedVenueId || undefined,
      startDate: dateRange.from ? toISODateString(dateRange.from) : undefined,
      endDate: dateRange.to ? toISODateString(dateRange.to) : undefined,
    }),
    [selectedVenueId, dateRange]
  );

  const { data: questionAnalyses, isLoading: isAiLoading } = useQuestionAiAnalyses(
    aiFilterParams,
    { enabled: !!canReadSurvey }
  );

  const analysisByQuestion = useMemo(() => {
    const map: Record<string, SurveyQuestionAiAnalysis> = {};
    for (const a of questionAnalyses ?? []) {
      if (!map[a.questionKey]) map[a.questionKey] = a;
    }
    return map;
  }, [questionAnalyses]);

  const handleGenerateAi = useCallback(() => {
    generateQuestionsAi.mutate({
      eventId: selectedVenueId || undefined,
      startDate: dateRange.from ? toISODateString(dateRange.from) : undefined,
      endDate: dateRange.to ? toISODateString(dateRange.to) : undefined,
    });
  }, [generateQuestionsAi, selectedVenueId, dateRange]);

  const isGeneratingAi = generateQuestionsAi.isPending;
  const canGenerateAi = canReadSurveyRegion || canReadSurveyAll;

  // ── Permissions guard ────────────────────────────────────────────────
  useEffect(() => {
    if (session?.user && canReadSurvey === false) {
      router.push("/");
    }
  }, [session, canReadSurvey, router]);

  // ── Loading / auth guards ────────────────────────────────────────────
  if (!session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!canReadSurvey) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <main className="mx-auto max-w-7xl px-4 py-6 md:py-8">
          <ErrorState message="Anda tidak memiliki akses ke halaman ini." />
        </main>
      </div>
    );
  }

  const isInitialLoading = regionsLoading || eventsLoading;

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <main className="mx-auto max-w-7xl px-4 py-6 md:py-8">
        {/* Top bar: Back + Version Switcher */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            onClick={() => router.push("/survey/report")}
            className="flex items-center gap-1.5 text-xs text-gray-500 transition-colors hover:text-gray-900 self-start"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Kembali ke Report
          </button>
          <VersionSwitcher />
        </div>

        {isInitialLoading ? (
          <ReportSkeleton />
        ) : (
          <div className="space-y-4 md:space-y-6">
            {/* ── 1. FILTER — paling atas ── */}
            <FilterBar
              venues={venues}
              regions={regions}
              selectedVenueId={selectedVenueId}
              selectedRegionId={selectedRegionId}
              dateRange={dateRange}
              onVenueChange={setSelectedVenueId}
              onRegionChange={(val) => {
                setSelectedRegionId(val);
                setSelectedVenueId(""); // Reset venue when region changes
              }}
              onDateRangeChange={setDateRange}
            />

            {/* ── 2. HEADER (SGM logo + title) ── */}
            <PageHeader />

            {/* ── 3. INFO (Region / Period / Venue) ── */}
            <InfoHeader
              selectedRegionId={selectedRegionId}
              selectedVenueName={
                selectedVenueId
                  ? venues.find((v) => v.id === selectedVenueId)?.venueName || ""
                  : ""
              }
              dateRange={dateRange}
              regions={regions}
            />

            {/* ── 4. QUESTION SECTIONS ── */}
            {isReportLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <div
                    key={i}
                    className="h-[420px] animate-pulse rounded-2xl bg-gray-100"
                  />
                ))}
              </div>
            ) : isReportError ? (
              <div className="rounded-2xl border border-red-100 bg-red-50 px-6 py-10 text-center">
                <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-red-300" />
                <p className="text-sm font-medium text-red-700">
                  Gagal memuat data perbandingan. Silakan coba lagi.
                </p>
              </div>
            ) : (
              <div className="space-y-4 md:space-y-6">
                {visibleSections.map(({ q, regionsData }, sectionIdx) => {
                  const aiAnalysis = analysisByQuestion[q.key];

                  return (
                    <QuestionSection
                      key={q.key}
                      number={String(sectionIdx + 1).padStart(2, "0")}
                      title={q.label}
                      icon={q.icon}
                      iconBg={q.iconBg}
                      iconColor={q.iconColor}
                    >
                      {/* Varied visual per question — chosen by data character */}
                      {q.chart === "heatmap" && (
                        <HeatmapTable regionsData={regionsData} />
                      )}

                      {q.chart === "progress" && (
                        <CrewProgressCard
                          regionsData={regionsData}
                          positiveLabel={CREW_POSITIVE_LABEL}
                          allSurveysCount={allRegionReport?.totalSurveys}
                        />
                      )}

                      {q.chart === "donut" && (
                        <ProfessionDonutGrid regionsData={regionsData} />
                      )}

                      {q.chart === "popularity" && (
                        <ActivityPopularityCards regionsData={regionsData} />
                      )}

                      {q.chart === "lollipop" && (
                        <LollipopChart regionsData={regionsData} />
                      )}

                      {q.chart === "treemap" && (
                        <PackageTreemapGrid regionsData={regionsData} />
                      )}

                      {q.chart === "bar" && (
                        <GroupedBarChart
                          data={buildComparisonData(regionsData)}
                          regions={regionDefs}
                        />
                      )}

                      {/* AI qualitative analysis + timestamp */}
                      <QuestionAiCard
                        analysis={aiAnalysis}
                        isLoading={isAiLoading || isGeneratingAi}
                      />
                    </QuestionSection>
                  );
                })}
              </div>
            )}

            {/* ── 5. AI GENERATION TOOLBAR — moved to bottom */}
            <AiGenerationBar
              canGenerateAi={canGenerateAi}
              isGeneratingAi={isGeneratingAi}
              hasAnyAnalysis={Object.keys(analysisByQuestion).length > 0}
              handleGenerateAi={handleGenerateAi}
            />
          </div>
        )}
      </main>
    </div>
  );
}
