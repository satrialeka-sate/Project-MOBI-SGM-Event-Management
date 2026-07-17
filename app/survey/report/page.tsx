"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, BarChart3, Users, Calendar, MapPin, Brain, RefreshCw, Sparkles, Lightbulb, AlertTriangle, Target } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import ErrorState from "@/components/ErrorState";
import { Card, CardContent } from "@/components/ui/card";
import { usePermissions } from "@/hooks/use-permissions";
import { useSurveyReport, useEventAiAnalysis, useRegionAiAnalysis, useAllAiAnalysis, useGenerateEventAiAnalysis, useGenerateRegionAiAnalysis, useGenerateAllAiAnalysis } from "@/hooks/use-survey";
import { useRegions } from "@/hooks/use-regions";
import { useEvents } from "@/hooks/use-events";
import type { SurveyReport, QuestionStat } from "@/types/survey";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const COLORS = ["#E63946", "#457B9D", "#1D3557", "#2A9D8F", "#E9C46A", "#F4A261", "#A8DADC", "#6D6875"];

function formatDate(iso: string): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function QuestionChart({ question }: { question: QuestionStat }) {
  const data = question.answers
    .filter((a) => a.count > 0)
    .map((a) => ({
      name: a.label,
      value: a.count,
      percentage: a.percentage,
    }));

  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-gray-400">
        No data
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bar Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11 }}
              width={180}
            />
            <Tooltip
              formatter={(value, _name, props: any) => [
                `${value} (${props.payload?.percentage ?? 0}%)`,
                "Jawaban",
              ]}
            />
            <Bar dataKey="value" fill="#E63946" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pie Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={80}
              innerRadius={40}
              dataKey="value"
              label={({ name, ...rest }: any) => `${rest.percentage ?? 0}%`}
              labelLine={true}
            >
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value, _name, props: any) => [
              `${value} (${props.payload?.percentage ?? 0}%)`,
              "Jawaban",
            ]} />
            <Legend
              layout="vertical"
              align="right"
              verticalAlign="middle"
              wrapperStyle={{ fontSize: 11 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Detail table */}
      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500">
              <th className="px-4 py-2">Jawaban</th>
              <th className="px-4 py-2 text-right">Jumlah</th>
              <th className="px-4 py-2 text-right">Persentase</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-gray-900">{row.name}</td>
                <td className="px-4 py-2 text-right font-medium">{row.value}</td>
                <td className="px-4 py-2 text-right text-gray-500">{row.percentage}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function SurveyReportPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const { canReadSurvey, canReadSurveyRegion, canReadSurveyAll } = usePermissions();
  const { data: regions } = useRegions();
  const { data: eventsData } = useEvents({ limit: 100, enabled: canReadSurvey });

  // Filters
  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedRegionId, setSelectedRegionId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: report, isLoading, isError, refetch } = useSurveyReport({
    eventId: selectedEventId || undefined,
    regionId: selectedRegionId || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  // AI Analysis hooks
  const hasAiAccess = canReadSurvey; // At minimum, users with surveys.read can use AI
  const canGenerateAi = canReadSurvey;
  const canGenerateRegionAi = canReadSurveyRegion || canReadSurveyAll;
  const canGenerateAllAi = canReadSurveyAll;

  // Determine which AI analysis to fetch based on current filters
  const { data: eventAiAnalysis, isLoading: isEventAiLoading } = useEventAiAnalysis(
    selectedEventId || undefined,
    { enabled: hasAiAccess && !!selectedEventId && !selectedRegionId }
  );
  const { data: regionAiAnalysis, isLoading: isRegionAiLoading } = useRegionAiAnalysis(
    selectedRegionId || undefined,
    { enabled: hasAiAccess && !!selectedRegionId && !selectedEventId }
  );
  const { data: allAiAnalysis, isLoading: isAllAiLoading } = useAllAiAnalysis({
    enabled: hasAiAccess && !selectedEventId && !selectedRegionId && canGenerateAllAi
  });

  const aiAnalysis = eventAiAnalysis ?? regionAiAnalysis ?? allAiAnalysis;
  const isAiLoading = isEventAiLoading || isRegionAiLoading || isAllAiLoading;

  // AI generation mutations
  const generateEventAi = useGenerateEventAiAnalysis();
  const generateRegionAi = useGenerateRegionAiAnalysis();
  const generateAllAi = useGenerateAllAiAnalysis();

  const isGeneratingAi = generateEventAi.isPending || generateRegionAi.isPending || generateAllAi.isPending;

  const handleGenerateAi = () => {
    if (selectedEventId) {
      generateEventAi.mutate(selectedEventId);
    } else if (selectedRegionId) {
      generateRegionAi.mutate(selectedRegionId);
    } else {
      generateAllAi.mutate();
    }
  };

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/login");
    }
  }, [authStatus, router]);

  if (authStatus === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sgm-red" />
      </div>
    );
  }

  const canViewRegionReport = canReadSurveyRegion || canReadSurveyAll;
  const canViewAllReport = canReadSurveyAll;

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <main className="mx-auto max-w-5xl px-4 py-6 md:py-10">
        <button
          className="mb-4 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
          onClick={() => router.push("/survey")}
        >
          <ArrowLeft className="h-4 w-4" /> Back to Survey
        </button>

        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900 md:text-2xl">Report Survey</h1>
          <p className="mt-1 text-sm text-gray-500">Statistik hasil survey</p>
        </div>

        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="text-xs font-medium text-gray-500">Event</label>
            <select
              value={selectedEventId}
              onChange={(e) => { setSelectedEventId(e.target.value); setSelectedRegionId(""); }}
              className="mt-1 h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none focus:border-sgm-red"
            >
              <option value="">Semua Event</option>
              {eventsData?.items.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.venueName}</option>
              ))}
            </select>
          </div>

          {canViewRegionReport && (
            <div>
              <label className="text-xs font-medium text-gray-500">Region</label>
              <select
                value={selectedRegionId}
                onChange={(e) => { setSelectedRegionId(e.target.value); setSelectedEventId(""); }}
                className="mt-1 h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none focus:border-sgm-red"
                disabled={!!selectedEventId}
              >
                <option value="">Semua Region</option>
                {regions?.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-gray-500">Dari Tanggal</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none focus:border-sgm-red"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500">Sampai Tanggal</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none focus:border-sgm-red"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-sgm-red" />
          </div>
        ) : isError ? (
          <ErrorState message="Gagal memuat report" onRetry={() => refetch()} />
        ) : report ? (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Card>
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sgm-red-light">
                    <BarChart3 className="h-6 w-6 text-sgm-red" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{report.totalSurveys}</p>
                    <p className="text-xs text-gray-500">Total Survey</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{report.totalEvents}</p>
                    <p className="text-xs text-gray-500">Total Event</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50">
                    <MapPin className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{report.totalRegions}</p>
                    <p className="text-xs text-gray-500">Total Region</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Rentang Tanggal</p>
                    <p className="text-xs font-medium text-gray-900">
                      {formatDate(report.startDate)} - {formatDate(report.endDate)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* AI Insights Section */}
            {hasAiAccess && report.totalSurveys > 0 && (
              <div className="rounded-xl border border-purple-100 bg-gradient-to-br from-purple-50 to-white p-4 shadow-sm md:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
                      <Brain className="h-4 w-4 text-purple-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      🤖 AI Insight
                    </h2>
                  </div>
                  {canGenerateAi && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateAi}
                      disabled={isGeneratingAi}
                      className="border-purple-200 text-purple-700 hover:bg-purple-100"
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

                {isAiLoading || isGeneratingAi ? (
                  <div className="space-y-3">
                    <div className="h-4 w-full animate-pulse rounded bg-purple-100" />
                    <div className="h-4 w-5/6 animate-pulse rounded bg-purple-100" />
                    <div className="h-4 w-4/6 animate-pulse rounded bg-purple-100" />
                    <div className="mt-4 space-y-2">
                      <div className="h-4 w-2/6 animate-pulse rounded bg-purple-100" />
                      <div className="h-4 w-3/6 animate-pulse rounded bg-purple-100" />
                      <div className="h-4 w-3/6 animate-pulse rounded bg-purple-100" />
                    </div>
                  </div>
                ) : aiAnalysis ? (
                  <div className="space-y-5">
                    {/* Executive Summary */}
                    <div>
                      <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                        <Sparkles className="h-4 w-4 text-purple-500" />
                        Executive Summary
                      </h3>
                      <p className="text-sm leading-relaxed text-gray-700">
                        {aiAnalysis.executiveSummary}
                      </p>
                    </div>

                    {/* Key Insights */}
                    <div>
                      <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                        <Lightbulb className="h-4 w-4 text-amber-500" />
                        Key Insights
                      </h3>
                      <ul className="space-y-1.5">
                        {aiAnalysis.keyInsights.map((insight, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-medium text-amber-700">
                              {idx + 1}
                            </span>
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Recommendations */}
                    <div>
                      <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                        <Target className="h-4 w-4 text-green-500" />
                        Recommendations
                      </h3>
                      <ul className="space-y-1.5">
                        {aiAnalysis.recommendations.map((rec, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-medium text-green-700">
                              {idx + 1}
                            </span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Anomalies / Important Findings */}
                    {aiAnalysis.anomalies.length > 0 && (
                      <div>
                        <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          Important Findings / Anomalies
                        </h3>
                        <ul className="space-y-1.5">
                          {aiAnalysis.anomalies.map((anomaly, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                              <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-medium text-red-700">
                                {idx + 1}
                              </span>
                              {anomaly}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Generated timestamp */}
                    <div className="border-t border-purple-100 pt-3 text-xs text-gray-400">
                      Terakhir diperbarui: {formatDate(aiAnalysis.generatedAt)}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-purple-200 bg-white px-6 py-10 text-center">
                    <Brain className="mx-auto mb-3 h-10 w-10 text-purple-300" />
                    <h3 className="text-sm font-semibold text-gray-900">Analisis AI Belum Tersedia</h3>
                    <p className="mt-1 text-xs text-gray-500">
                      Klik tombol "Generate AI Analysis" untuk mendapatkan insight dari AI berdasarkan data survey.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Questions */}
            {report.questions.map((question, idx) => (
              <div key={question.questionKey} className="rounded-xl border bg-white p-4 shadow-sm md:p-6">
                <h3 className="mb-4 text-base font-semibold text-gray-900">
                  {idx + 1}. {question.questionLabel}
                </h3>
                <QuestionChart question={question} />
              </div>
            ))}

            {report.totalSurveys === 0 && (
              <div className="rounded-xl border bg-white px-6 py-16 text-center">
                <BarChart3 className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                <h3 className="text-base font-semibold text-gray-900">Belum ada data survey</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Belum ada survey yang sesuai dengan filter yang dipilih.
                </p>
              </div>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
}
