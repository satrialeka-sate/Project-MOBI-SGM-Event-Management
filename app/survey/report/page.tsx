"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Loader2, ArrowLeft, BarChart3, Users, Calendar, MapPin,
  Brain, RefreshCw, Sparkles, Lightbulb, AlertTriangle, Target,
  Clock, Filter, Activity, ShoppingBag, Home, UserCheck,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import ErrorState from "@/components/ErrorState";
import { usePermissions } from "@/hooks/use-permissions";
import {
  useSurveyReport, useEventAiAnalysis, useRegionAiAnalysis,
  useAllAiAnalysis, useGenerateEventAiAnalysis,
  useGenerateRegionAiAnalysis, useGenerateAllAiAnalysis,
} from "@/hooks/use-survey";
import { useRegions } from "@/hooks/use-regions";
import { useEvents } from "@/hooks/use-events";
import type { SurveyReport, QuestionStat, AnswerStat } from "@/types/survey";
import type { SurveyAiAnalysis } from "@/types/survey-ai";
import type { DateRange } from "@/components/ui/date-range-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LabelList,
} from "recharts";

// ─── Color Palette ─────────────────────────────────────────────────────
const SGM_RED = "#e30613";
const SGM_RED_LIGHT = "#ffecee";
const SGM_RED_PALE = "#fff5f5";
const SGM_DARK = "#b71c1c";

const CHART_COLORS = [
  "#e30613", "#457B9D", "#1D3557", "#2A9D8F",
  "#E9C46A", "#F4A261", "#A8DADC", "#6D6875",
  "#E76F51", "#264653", "#2A9D8F", "#E9C46A",
];

const PROFESSION_COLORS = ["#e30613", "#457B9D", "#2A9D8F", "#F4A261"];
const NOT_BUYING_COLORS = ["#E76F51", "#457B9D", "#6D6875", "#2A9D8F"];
const BUYING_COLORS = ["#e30613", "#2A9D8F", "#457B9D"];
const PACKAGE_COLORS = ["#e30613", "#F4A261", "#457B9D", "#A8DADC"];
const ACTIVITY_COLORS = ["#e30613", "#457B9D", "#2A9D8F", "#E9C46A", "#F4A261", "#1D3557"];
const IMPRESSION_COLORS = ["#e30613", "#2A9D8F", "#457B9D", "#F4A261"];
const CREW_COLORS = ["#2A9D8F", "#E76F51", "#E9C46A"];

// ─── Helpers ───────────────────────────────────────────────────────────
function formatDate(iso: string): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(iso: string): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function findQuestion(report: SurveyReport, key: string): QuestionStat | undefined {
  return report.questions.find((q) => q.questionKey === key);
}

function chartData(answers: AnswerStat[]) {
  return answers
    .filter((a) => a.count > 0)
    .map((a) => ({
      name: a.label,
      value: a.count,
      percentage: a.percentage,
    }))
    .sort((a, b) => b.value - a.value);
}

function totalAnswers(answers: AnswerStat[]) {
  return answers.reduce((sum, a) => sum + a.count, 0);
}

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

// ─── Custom Tooltip ────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm">
      <p className="mb-1 text-xs font-medium text-gray-600">{label}</p>
      {payload.map((entry: any, idx: number) => (
        <p key={idx} className="text-sm font-bold" style={{ color: entry.color }}>
          {entry.value} responden ({entry.payload?.percentage ?? 0}%)
        </p>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// VISUALIZATION COMPONENTS
// ═══════════════════════════════════════════════════════════════════════

// ─── 1. Profession Cards ──────────────────────────────────────────────
const PROFESSION_IMAGES: Record<string, string> = {
  "Ibu Rumah Tangga": "/assets/survey/profesi-irt.svg",
  "Wirausaha / UMKM": "/assets/survey/profesi-umkm.svg",
  Profesional: "/assets/survey/profesi-profesional.svg",
  Pekerja: "/assets/survey/profesi-pekerja.svg",
};

function ProfessionCards({ answers }: { answers: AnswerStat[] }) {
  const data = chartData(answers);

  return (
    <div className="grid grid-cols-4 gap-2 md:gap-3">
      {data.map((item, idx) => (
        <div
          key={idx}
          className="relative flex flex-col items-center justify-center text-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-100 transition-all duration-300 hover:shadow-md px-1.5 py-4 md:px-3 md:py-7"
        >
          {/* Icon */}
          <div
            className="mb-2 flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg md:h-16 md:w-16"
            style={{
              backgroundColor: `${PROFESSION_COLORS[idx % PROFESSION_COLORS.length]}15`,
            }}
          >
            <img
              src={PROFESSION_IMAGES[item.name] || "/assets/survey/profesi-irt.png"}
              alt={item.name}
              className="h-8 w-8 object-contain md:h-10 md:w-10"
            />
          </div>

          {/* Percentage */}
          <div className="mb-1 text-2xl font-bold tracking-tight md:text-3xl" style={{ color: PROFESSION_COLORS[idx % PROFESSION_COLORS.length] }}>
            {item.percentage}%
          </div>

          {/* Name */}
          <div className="text-[11px] font-medium text-gray-700 leading-tight md:text-sm">
            {item.name}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── 2. Horizontal Bar Chart ──────────────────────────────────────────
function HorizontalBarChartCard({
  answers,
  colors,
}: {
  answers: AnswerStat[];
  colors: string[];
}) {
  const data = chartData(answers);

  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg bg-gray-50 text-sm text-gray-400">
        Belum ada data
      </div>
    );
  }

  return (
    <div>
      <div className="h-[180px] md:h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ left: 5, right: 40, top: 5, bottom: 5 }}
            barSize={24}
            barGap={6}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 10, fill: "#6B7280" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 10, fill: "#374151" }}
              width={120}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
            <Bar
              dataKey="value"
              radius={[0, 4, 4, 0]}
            >
              {data.map((entry, idx) => (
                <Cell
                  key={idx}
                  fill={colors[idx % colors.length]}
                />
              ))}
              <LabelList
                dataKey="value"
                position="right"
                formatter={(value: any) => `${value}`}
                style={{ fontSize: "10px", fontWeight: 600, fill: "#374151" }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Percentage labels alongside bars */}
      <div className="mt-2 space-y-1 px-1 md:px-2">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between text-xs md:text-sm">
            <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
              <div
                className="h-2 w-2 shrink-0 rounded-full md:h-2.5 md:w-2.5"
                style={{ backgroundColor: colors[idx % colors.length] }}
              />
              <span className="text-gray-600 truncate">{item.name}</span>
            </div>
            <div className="flex items-center gap-2 md:gap-3 shrink-0">
              <span className="font-semibold text-gray-900">{item.percentage}%</span>
              <span className="text-[9px] text-gray-400 md:text-xs">({item.value})</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 3. Vertical Column Chart ─────────────────────────────────────────
function VerticalColumnChartCard({
  answers,
  colors,
}: {
  answers: AnswerStat[];
  colors: string[];
}) {
  const data = chartData(answers);

  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg bg-gray-50 text-sm text-gray-400">
        Belum ada data
      </div>
    );
  }

  return (
    <div>
      <div className="h-[180px] md:h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ left: 5, right: 5, top: 10, bottom: 2 }}
            barSize={32}
            barGap={0}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="name"
              tick={false}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 9, fill: "#6B7280" }}
              axisLine={false}
              tickLine={false}
              width={25}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
            <Bar
              dataKey="value"
              radius={[4, 4, 0, 0]}
            >
              {data.map((entry, idx) => (
                <Cell
                  key={idx}
                  fill={colors[idx % colors.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Data table below */}
      <div className="mt-2 space-y-1 md:mt-3 md:space-y-1.5">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between rounded-lg bg-gray-50 px-2 py-1.5 text-xs md:px-3 md:py-2 md:text-sm">
            <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
              <div
                className="h-2 w-2 shrink-0 rounded-full md:h-2.5 md:w-2.5"
                style={{ backgroundColor: colors[idx % colors.length] }}
              />
              <span className="text-gray-700 truncate">{item.name}</span>
            </div>
            <div className="flex items-center gap-2 md:gap-3 shrink-0">
              <span className="font-semibold text-gray-900">{item.percentage}%</span>
              <span className="text-[9px] text-gray-400 md:text-xs">({item.value})</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 4. Donut Chart ───────────────────────────────────────────────────
function DonutChartCard({
  answers,
  colors,
}: {
  answers: AnswerStat[];
  colors: string[];
}) {
  const data = chartData(answers);
  const total = totalAnswers(answers);

  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg bg-gray-50 text-sm text-gray-400">
        Belum ada data
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center md:flex-row md:items-center md:gap-4">
      {/* Donut */}
      <div className="h-[160px] w-full md:h-[220px] md:w-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={70}
              innerRadius={42}
              dataKey="value"
              paddingAngle={2}
              cornerRadius={3}
            >
              {data.map((_, idx) => (
                <Cell
                  key={idx}
                  fill={colors[idx % colors.length]}
                  stroke="none"
                />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-3 w-full space-y-1.5 md:mt-0 md:flex-1 md:space-y-2">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between gap-2 md:gap-3">
            <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
              <div
                className="h-2.5 w-2.5 shrink-0 rounded-full md:h-3 md:w-3"
                style={{ backgroundColor: colors[idx % colors.length] }}
              />
              <span className="text-[11px] text-gray-700 truncate md:text-sm">{item.name}</span>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
              <span className="text-xs font-bold text-gray-900 md:text-sm">{item.percentage}%</span>
              <span className="text-[9px] text-gray-400 md:text-xs">({item.value})</span>
            </div>
          </div>
        ))}
        <div className="border-t pt-1.5 text-[10px] text-gray-400 md:pt-2 md:text-xs">
          Total: {total} responden
        </div>
      </div>
    </div>
  );
}

// ─── 5. Radial Progress (SVG) ────────────────────────────────────────
function RadialProgress({
  percentage,
  color,
  size = 80,
  strokeWidth = 6,
}: {
  percentage: number;
  color: string;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const center = size / 2;

  return (
    <svg width={size} height={size} className="drop-shadow-sm">
      {/* Background circle */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="#f3f4f6"
        strokeWidth={strokeWidth}
      />
      {/* Progress circle */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${center} ${center})`}
        className="transition-all duration-1000 ease-out"
      />
      {/* Percentage text */}
      <text
        x={center}
        y={center}
        textAnchor="middle"
        dominantBaseline="central"
        className="text-sm font-bold"
        fill={color}
        fontSize={size > 80 ? "14" : "12"}
      >
        {percentage}%
      </text>
    </svg>
  );
}

function RadialProgressChartCard({ answers }: { answers: AnswerStat[] }) {
  const data = chartData(answers);

  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg bg-gray-50 text-sm text-gray-400">
        Belum ada data
      </div>
    );
  }

  return (
    <div className="flex flex-wrap justify-center gap-2 md:gap-3">
      {data.map((item, idx) => (
        <div
          key={idx}
          className="flex w-[calc(50%-4px)] flex-col items-center rounded-xl bg-gray-50/80 p-2.5 text-center transition-all duration-300 hover:bg-gray-50 hover:shadow-sm md:w-[calc(50%-6px)] md:p-3"
        >
          <RadialProgress
            percentage={item.percentage}
            color={ACTIVITY_COLORS[idx % ACTIVITY_COLORS.length]}
            size={64}
          />
          <div className="mt-1.5 text-[10px] font-medium text-gray-700 leading-tight md:text-xs">
            {item.name}
          </div>
          <div className="mt-0.5 text-[9px] text-gray-400 md:text-[10px]">
            {item.value} responden
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── 6. Memorable Impression (Bar + Circular Combo) ───────────────────
function CircularPercentage({ percentage, color }: { percentage: number; color: string; label?: string }) {
  const radius = 22;
  const strokeWidth = 4;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const center = radius + strokeWidth;
  const size = (radius + strokeWidth) * 2;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="drop-shadow-sm">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#f3f4f6"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
          className="transition-all duration-1000 ease-out"
        />
        <text
          x={center}
          y={center}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="9"
          fontWeight="bold"
          fill={color}
        >
          {percentage}%
        </text>
      </svg>
    </div>
  );
}

function MemorableImpressionChart({ answers }: { answers: AnswerStat[] }) {
  const data = chartData(answers);

  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg bg-gray-50 text-sm text-gray-400">
        Belum ada data
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Vertical Bar Chart */}
      <div>
        <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500 md:text-xs">
          Distribusi Jawaban
        </h4>
        <div className="h-[160px] md:h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ left: 5, right: 5, top: 5, bottom: 2 }}
              barSize={34}
              barGap={0}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="name"
                tick={false}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#6B7280" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
              <Bar
                dataKey="value"
                radius={[4, 4, 0, 0]}
              >
                {data.map((entry, idx) => (
                  <Cell
                    key={idx}
                    fill={IMPRESSION_COLORS[idx % IMPRESSION_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Circular Percentage Cards */}
      <div>
        <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500 md:text-xs">
          Persentase per Kategori
        </h4>
        <div className="grid grid-cols-2 gap-2 md:gap-3">
          {data.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2.5 rounded-xl bg-gray-50/80 px-3 py-2.5 transition-all duration-200 hover:bg-gray-50 md:px-4 md:py-3"
            >
              <CircularPercentage
                percentage={item.percentage}
                color={IMPRESSION_COLORS[idx % IMPRESSION_COLORS.length]}
              />
              <div className="min-w-0">
                <div className="text-[11px] font-medium text-gray-700 leading-tight md:text-sm">{item.name}</div>
                <div className="mt-0.5 text-[10px] text-gray-400">{item.value} suara</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── 7. Crew Impression (Horizontal Bar) ──────────────────────────────
function formatPercentage(pct: number, count: number): string {
  if (pct === 0 && count > 0) return "<1%";
  return `${pct}%`;
}

function CrewImpressionChart({ answers }: { answers: AnswerStat[] }) {
  const data = chartData(answers);

  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg bg-gray-50 text-sm text-gray-400">
        Belum ada data
      </div>
    );
  }

  return (
    <div className="space-y-3 md:space-y-4">
      {data.map((item, idx) => {
        const color = CREW_COLORS[idx % CREW_COLORS.length];
        // Bar width matches the actual percentage value
        const barWidth = Math.max(item.percentage, item.value > 0 ? 1 : 0);
        const pctLabel = formatPercentage(item.percentage, item.value);

        return (
          <div key={idx} className="group">
            <div className="mb-1 flex items-center justify-between md:mb-1.5">
              <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
                <div
                  className="h-2 w-2 shrink-0 rounded-full md:h-2.5 md:w-2.5"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs font-medium text-gray-700 truncate md:text-sm">{item.name}</span>
              </div>
              <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
                <span className="text-xs font-bold text-gray-900 md:text-sm">{pctLabel}</span>
                <span className="text-[9px] text-gray-400 md:text-xs">({item.value})</span>
              </div>
            </div>
            {/* Progress bar — width reflects actual % */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 md:h-3">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out group-hover:opacity-80"
                style={{
                  width: `${barWidth}%`,
                  backgroundColor: color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// AI INSIGHT CARD
// ═══════════════════════════════════════════════════════════════════════
function AiInsightCard({
  aiAnalysis,
  isAiLoading,
  isGeneratingAi,
  canGenerateAi,
  handleGenerateAi,
}: {
  aiAnalysis: SurveyAiAnalysis | null | undefined;
  isAiLoading: boolean;
  isGeneratingAi: boolean;
  canGenerateAi: boolean;
  handleGenerateAi: () => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-pink-200/60 bg-gradient-to-br from-pink-50 via-white to-rose-50 p-6 shadow-sm md:p-8">
      {/* Decorative background elements */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br from-pink-200/20 to-rose-200/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-gradient-to-tr from-purple-200/20 to-pink-200/20 blur-3xl" />

      {/* Header */}
      <div className="relative mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 shadow-sm">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">✨ AI Survey Insight</h2>
            <p className="text-xs text-gray-500">Analisis cerdas berbasis data survey</p>
          </div>
        </div>
        {canGenerateAi && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateAi}
            disabled={isGeneratingAi}
            className="self-start border-pink-200 bg-white/80 text-pink-700 hover:bg-pink-100 hover:text-pink-800"
          >
            {isGeneratingAi ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                Menganalisis...
              </>
            ) : aiAnalysis ? (
              <>
                <RefreshCw className="mr-1.5 h-4 w-4" />
                Refresh Analysis
              </>
            ) : (
              <>
                <Sparkles className="mr-1.5 h-4 w-4" />
                Generate AI Analysis
              </>
            )}
          </Button>
        )}
      </div>

      {/* Content */}
      {isAiLoading || isGeneratingAi ? (
        <div className="relative space-y-4">
          <div className="h-3 w-full animate-pulse rounded-full bg-pink-100" />
          <div className="h-3 w-5/6 animate-pulse rounded-full bg-pink-100" />
          <div className="h-3 w-4/6 animate-pulse rounded-full bg-pink-100" />
          <div className="mt-4 space-y-2">
            <div className="h-3 w-2/6 animate-pulse rounded-full bg-pink-100" />
            <div className="h-3 w-3/6 animate-pulse rounded-full bg-pink-100" />
            <div className="h-3 w-3/6 animate-pulse rounded-full bg-pink-100" />
          </div>
        </div>
      ) : aiAnalysis ? (
        <div className="relative space-y-6">
          {/* Conclusion (stored in executiveSummary) */}
          <div className="rounded-xl border border-pink-100 bg-white/80 p-4 backdrop-blur-sm md:p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Sparkles className="h-4 w-4 text-pink-500" />
              Kesimpulan
            </h3>
            <p className="text-sm leading-relaxed text-gray-700">
              {aiAnalysis.executiveSummary}
            </p>
          </div>

          {/* Key Insights */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              5 Insight Utama
            </h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {aiAnalysis.keyInsights.map((insight, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 rounded-lg border border-amber-100 bg-amber-50/50 px-3.5 py-2.5"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200 text-[10px] font-bold text-amber-800">
                    {idx + 1}
                  </span>
                  <span className="text-sm text-gray-700">{insight}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Timestamp */}
          <div className="flex items-center gap-1.5 border-t border-pink-100 pt-4 text-xs text-gray-400">
            <Clock className="h-3 w-3" />
            Terakhir diperbarui: {formatDateTime(aiAnalysis.generatedAt)}
          </div>
        </div>
      ) : (
        <div className="relative rounded-xl border border-dashed border-pink-200 bg-white/60 px-6 py-12 text-center backdrop-blur-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-100 to-rose-100">
            <Brain className="h-8 w-8 text-pink-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">Analisis AI Belum Tersedia</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
            Klik tombol &quot;Generate AI Analysis&quot; untuk mendapatkan insight cerdas
            berdasarkan data survey yang terkumpul.
          </p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// SUMMARY CARDS
// ═══════════════════════════════════════════════════════════════════════
function SummaryCards({ report }: { report: SurveyReport }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
      {/* Total Surveys */}
      <div className="group relative overflow-hidden rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100 transition-all duration-300 hover:shadow-md md:p-5">
        <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-sgm-red-light opacity-50 transition-all duration-300 group-hover:scale-125" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sgm-red-light md:h-12 md:w-12">
            <BarChart3 className="h-5 w-5 text-sgm-red md:h-6 md:w-6" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900 md:text-2xl">{report.totalSurveys}</p>
            <p className="text-[10px] text-gray-500 md:text-xs">Total Responden</p>
          </div>
        </div>
      </div>

      {/* Total Events */}
      <div className="group relative overflow-hidden rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100 transition-all duration-300 hover:shadow-md md:p-5">
        <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-blue-50 opacity-50 transition-all duration-300 group-hover:scale-125" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 md:h-12 md:w-12">
            <Calendar className="h-5 w-5 text-blue-600 md:h-6 md:w-6" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900 md:text-2xl">{report.totalEvents}</p>
            <p className="text-[10px] text-gray-500 md:text-xs">Total Event</p>
          </div>
        </div>
      </div>

      {/* Total Regions */}
      <div className="group relative overflow-hidden rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100 transition-all duration-300 hover:shadow-md md:p-5">
        <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-green-50 opacity-50 transition-all duration-300 group-hover:scale-125" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 md:h-12 md:w-12">
            <MapPin className="h-5 w-5 text-green-600 md:h-6 md:w-6" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900 md:text-2xl">{report.totalRegions}</p>
            <p className="text-[10px] text-gray-500 md:text-xs">Total Region</p>
          </div>
        </div>
      </div>

      {/* Date Range */}
      <div className="group relative overflow-hidden rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100 transition-all duration-300 hover:shadow-md md:p-5">
        <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-purple-50 opacity-50 transition-all duration-300 group-hover:scale-125" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 md:h-12 md:w-12">
            <Clock className="h-5 w-5 text-purple-600 md:h-6 md:w-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Periode</p>
            <p className="text-[10px] font-medium text-gray-900 leading-tight md:text-xs">
              {formatDate(report.startDate)} — {formatDate(report.endDate)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// INFO HEADER — professional metadata layout
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
    : "Seluruh periode data";

  return (
    <div className="rounded-xl bg-white px-5 py-3.5 shadow-sm ring-1 ring-gray-100 md:px-6 md:py-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {/* Region */}
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Region :</span>
          <span className="break-words whitespace-normal text-xs font-medium leading-[1.4] text-gray-700">{regionLabel}</span>
        </div>

        {/* Periode */}
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Periode :</span>
          <span className="break-words whitespace-normal text-xs font-medium leading-[1.4] text-gray-700">{periodLabel}</span>
        </div>

        {/* Venue — full width on all devices */}
        <div className="flex flex-col gap-0.5 md:col-span-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Venue :</span>
          <span className="break-words whitespace-normal text-xs font-medium leading-[1.4] text-gray-700">{venueLabel}</span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// FILTER BAR — REDESIGNED
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
  // Filter venues by selected region
  const filteredVenues = selectedRegionId
    ? venues.filter((v) => v.regionId === selectedRegionId)
    : venues;

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100 md:p-5">
      <div className="mb-3 flex items-center gap-2">
        <Filter className="h-4 w-4 text-gray-400" />
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Filter Data</span>
      </div>

      {/* Unified layout: same on ALL devices */}
      <div className="space-y-3">
        {/* Row 1: Region | Venue — 2 columns always */}
        <div className="grid grid-cols-2 gap-3">
          {/* Region */}
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

          {/* Venue */}
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-gray-500">Venue</label>
            <select
              value={selectedVenueId}
              onChange={(e) => onVenueChange(e.target.value)}
              className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-700 shadow-sm outline-none transition-all hover:border-gray-300 focus:border-sgm-red focus:ring-2 focus:ring-sgm-red/20 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239CA3AF%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[right_12px_center] bg-no-repeat pr-10"
            >
              <option value="">Semua Venue</option>
              {filteredVenues.map((v) => (
                <option key={v.id} value={v.id}>{v.venueName}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Periode — full width */}
        <div>
          <label className="mb-1.5 block text-[11px] font-medium text-gray-500">Periode</label>
          <DateRangePicker
            value={dateRange}
            onChange={onDateRangeChange}
            placeholder="Pilih Periode"
          />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// SECTION WRAPPER
// ═══════════════════════════════════════════════════════════════════════
function VizSection({
  number,
  title,
  subtitle,
  children,
}: {
  number: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition-all duration-300 hover:shadow-md">
      {/* Section header */}
      <div className="mb-4 flex items-start gap-3 md:mb-5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sgm-red-light text-sm font-bold text-sgm-red">
          {number}
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-bold text-gray-900 leading-snug md:text-lg">{title}</h3>
          {subtitle && (
            <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Content — full width chart area */}
      <div className="w-full">
        {children}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// LOADING SKELETON
// ═══════════════════════════════════════════════════════════════════════
function ReportSkeleton() {
  return (
    <div className="animate-pulse space-y-4 md:space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-gray-100 md:h-24" />
        ))}
      </div>

      {/* Filter */}
      <div className="h-[180px] rounded-xl bg-gray-100 md:h-[120px]" />

      {/* Viz sections in 2-col grid */}
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="h-[220px] rounded-2xl bg-gray-100 md:h-[280px]" />
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════
export default function SurveyReportPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const { canReadSurvey, canReadSurveyRegion, canReadSurveyAll } = usePermissions();
  const { data: regions } = useRegions();
  const { data: eventsData } = useEvents({ limit: 100, enabled: canReadSurvey });

  // Filters
  const [selectedRegionId, setSelectedRegionId] = useState("");
  const [selectedVenueId, setSelectedVenueId] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });

  // Derive API params from UI state
  const queryParams = useMemo(() => ({
    eventId: selectedVenueId || undefined,
    regionId: selectedRegionId || undefined,
    startDate: dateRange.from ? toISODateString(dateRange.from) : undefined,
    endDate: dateRange.to ? toISODateString(dateRange.to) : undefined,
  }), [selectedVenueId, selectedRegionId, dateRange]);

  const { data: report, isLoading, isError, refetch } = useSurveyReport(queryParams);

  // AI Analysis hooks
  const hasAiAccess = canReadSurvey;
  const canGenerateAi = canReadSurvey;
  const canGenerateRegionAi = canReadSurveyRegion || canReadSurveyAll;
  const canGenerateAllAi = canReadSurveyAll;

  const { data: eventAiAnalysis, isLoading: isEventAiLoading } = useEventAiAnalysis(
    selectedVenueId || undefined,
    { enabled: hasAiAccess && !!selectedVenueId && !selectedRegionId }
  );
  const { data: regionAiAnalysis, isLoading: isRegionAiLoading } = useRegionAiAnalysis(
    selectedRegionId || undefined,
    { enabled: hasAiAccess && !!selectedRegionId && !selectedVenueId }
  );
  const { data: allAiAnalysis, isLoading: isAllAiLoading } = useAllAiAnalysis({
    enabled: hasAiAccess && !selectedVenueId && !selectedRegionId && canGenerateAllAi
  });

  const aiAnalysis = eventAiAnalysis ?? regionAiAnalysis ?? allAiAnalysis;
  const isAiLoading = isEventAiLoading || isRegionAiLoading || isAllAiLoading;

  const generateEventAi = useGenerateEventAiAnalysis();
  const generateRegionAi = useGenerateRegionAiAnalysis();
  const generateAllAi = useGenerateAllAiAnalysis();
  const isGeneratingAi = generateEventAi.isPending || generateRegionAi.isPending || generateAllAi.isPending;

  const handleGenerateAi = () => {
    if (selectedVenueId) {
      generateEventAi.mutate(selectedVenueId);
    } else if (selectedRegionId) {
      generateRegionAi.mutate(selectedRegionId);
    } else {
      generateAllAi.mutate();
    }
  };

  const handleRegionChange = (val: string) => {
    setSelectedRegionId(val);
    // Clear venue when region changes
    setSelectedVenueId("");
  };

  const handleVenueChange = (val: string) => {
    setSelectedVenueId(val);
  };

  const canViewRegionReport = canReadSurveyRegion || canReadSurveyAll;

  // Find selected venue name for info header
  const venues = eventsData?.items || [];
  const selectedVenue = venues.find((v) => v.id === selectedVenueId);
  const selectedVenueName = selectedVenue?.venueName || "";

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/login");
    }
  }, [authStatus, router]);

  // Redirect unauthorized users (SPG, Team Leader, CLIENT) back to survey list
  useEffect(() => {
    if (authStatus === "authenticated" && !canViewRegionReport) {
      router.push("/survey");
    }
  }, [authStatus, router, canViewRegionReport]);

  if (authStatus === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sgm-red" />
      </div>
    );
  }

  // ─── Extract report data ─────────────────────────────────────────
  const professionQuestion = report ? findQuestion(report, "profession") : undefined;
  const buyingReasonQuestion = report ? findQuestion(report, "buyingReason") : undefined;
  const notBuyingReasonQuestion = report ? findQuestion(report, "notBuyingReason") : undefined;
  const packageQuestion = report ? findQuestion(report, "package") : undefined;
  const favoriteActivityQuestion = report ? findQuestion(report, "favoriteActivity") : undefined;
  const memorableImpressionQuestion = report ? findQuestion(report, "memorableImpression") : undefined;
  const crewImpressionQuestion = report ? findQuestion(report, "crewImpression") : undefined;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-6 md:py-10">
        {/* Back button */}
        <button
          className="mb-4 flex items-center gap-1.5 text-sm text-gray-400 transition-colors hover:text-gray-600"
          onClick={() => router.push("/survey")}
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Survey
        </button>

        {/* Filters — now at the top */}
        <div className="mb-6">
          <FilterBar
            venues={venues}
            regions={regions}
            selectedVenueId={selectedVenueId}
            selectedRegionId={selectedRegionId}
            dateRange={dateRange}
            onVenueChange={handleVenueChange}
            onRegionChange={handleRegionChange}
            onDateRangeChange={setDateRange}
          />
        </div>

        {/* Last updated indicator */}
        {report && report.totalSurveys > 0 && (
          <div className="mb-4 flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-1.5">
              <Activity className="h-3 w-3" />
              <span>Data diperbarui: {formatDateTime(new Date().toISOString())}</span>
            </div>
            {selectedRegionId && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Region:{' '}{regions?.find(r => r.id === selectedRegionId)?.name || selectedRegionId}
              </span>
            )}
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <ReportSkeleton />
        ) : isError ? (
          <ErrorState message="Gagal memuat data report" onRetry={() => refetch()} />
        ) : report && report.totalSurveys > 0 ? (
          <div>
            {/* Summary Statistics */}
            <SummaryCards report={report} />

            {/* Survey Results Infographics Header — above section 01 */}
            <div className="mt-6 mb-6 md:mt-8 md:mb-8">
              <h1 className="mb-6 text-3xl font-bold text-gray-900 md:text-4xl">
                Survey Results Infographics
              </h1>

              {/* Info Header (Region, Venue, Period) */}
              <InfoHeader
                selectedRegionId={selectedRegionId}
                selectedVenueName={selectedVenueName}
                dateRange={dateRange}
                regions={regions}
              />
            </div>

            {/* ── Visualisasi 1: Profesi Bunda — full width ── */}
            {professionQuestion && (
              <div className="mt-6 md:mt-8">
                <VizSection number="01" title="Profesi Bunda" subtitle="Distribusi profesi responden">
                  <ProfessionCards answers={professionQuestion.answers} />
                </VizSection>
              </div>
            )}

            {/* ── Visualisasi 2: Alasan Membeli — full width ── */}
            {buyingReasonQuestion && (
              <div className="mt-6 md:mt-8">
                <VizSection
                  number="02"
                  title="Apa yang membuat Bunda membeli produk SGM Eksplor?"
                  subtitle="Faktor utama yang mendorong pembelian"
                >
                  <HorizontalBarChartCard
                    answers={buyingReasonQuestion.answers}
                    colors={BUYING_COLORS}
                  />
                </VizSection>
              </div>
            )}

            {/* ── Visualisasi 3: Alasan Tidak Membeli — full width ── */}
            {notBuyingReasonQuestion && (
              <div className="mt-6 md:mt-8">
                <VizSection
                  number="03"
                  title="Jika tidak membeli, apa alasan Bunda?"
                  subtitle="Kendala yang menghambat pembelian"
                >
                  <VerticalColumnChartCard
                    answers={notBuyingReasonQuestion.answers}
                    colors={NOT_BUYING_COLORS}
                  />
                </VizSection>
              </div>
            )}

            {/* ── Visualisasi 4: Paket yang Dibeli — full width ── */}
            {packageQuestion && (
              <div className="mt-6 md:mt-8">
                <VizSection
                  number="04"
                  title="Paket yang Dibeli"
                  subtitle="Distribusi pilihan paket produk"
                >
                  <DonutChartCard
                    answers={packageQuestion.answers}
                    colors={PACKAGE_COLORS}
                  />
                </VizSection>
              </div>
            )}

            {/* ── Visualisasi 5: Aktivitas Favorit — full width ── */}
            {favoriteActivityQuestion && (
              <div className="mt-6 md:mt-8">
                <VizSection
                  number="05"
                  title="Aktivitas yang Paling Disukai"
                  subtitle="Tingkat popularitas setiap aktivitas event"
                >
                  <RadialProgressChartCard answers={favoriteActivityQuestion.answers} />
                </VizSection>
              </div>
            )}

            {/* ── Visualisasi 6: Kesan Paling Diingat — full width ── */}
            {memorableImpressionQuestion && (
              <div className="mt-6 md:mt-8">
                <VizSection
                  number="06"
                  title="Kesan yang Paling Diingat dari Event SGM"
                  subtitle="Hal yang paling membekas bagi pengunjung"
                >
                  <MemorableImpressionChart answers={memorableImpressionQuestion.answers} />
                </VizSection>
              </div>
            )}

            {/* ── Visualisasi 7: Penilaian Kru Event — full width ── */}
            {crewImpressionQuestion && (
              <div className="mt-6 md:mt-8">
                <VizSection
                  number="07"
                  title="Penilaian terhadap Kru Event"
                  subtitle="Kesan responden terhadap kru pelaksana"
                >
                  <CrewImpressionChart answers={crewImpressionQuestion.answers} />
                </VizSection>
              </div>
            )}

            {/* ── AI Insight — full width ── */}
            {hasAiAccess && (
              <div className="mt-6 md:mt-8">
                <AiInsightCard
                  aiAnalysis={aiAnalysis}
                  isAiLoading={isAiLoading}
                  isGeneratingAi={isGeneratingAi}
                  canGenerateAi={canGenerateAi}
                  handleGenerateAi={handleGenerateAi}
                />
              </div>
            )}

            {/* Footer */}
            <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 text-xs text-gray-400 md:mt-6">
              <span>© SGM Survey Report — Data diperbarui secara real-time</span>
              <span className="flex items-center gap-1">
                <Activity className="h-3 w-3" />
                {report.totalSurveys} data points
              </span>
            </div>
          </div>
        ) : report && report.totalSurveys === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-20">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
              <BarChart3 className="h-8 w-8 text-gray-300" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">Belum Ada Data Survey</h3>
            <p className="mt-1 text-sm text-gray-500">
              Belum ada survey yang sesuai dengan filter yang dipilih.
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Coba ubah filter atau tunggu hingga data survey tersedia.
            </p>
          </div>
        ) : null}
      </main>
    </div>
  );
}
