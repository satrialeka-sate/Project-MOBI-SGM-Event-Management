"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, ExternalLink, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { useSchedule } from "@/hooks/use-schedule";
import { usePermissions } from "@/hooks/use-permissions";
import { useRegions } from "@/hooks/use-regions";
import ErrorState from "@/components/ErrorState";
import { CardSkeleton } from "@/components/LoadingSkeleton";

const DAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

// Indonesian month names for display
const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export default function SchedulePage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1); // 1-indexed
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [cycle, setCycle] = useState("");
  const [regionId, setRegionId] = useState("");

  const { canReadSchedule, canReadRegion } = usePermissions();
  const { data: regions } = useRegions();

  const { data: schedule, isLoading, isError, refetch } = useSchedule({
    month: currentMonth,
    year: currentYear,
    regionId: regionId || undefined,
    cycle: cycle || undefined,
    enabled: canReadSchedule,
  });

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

  if (!session?.user) return null;

  const goToPrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today.getMonth() + 1);
    setCurrentYear(today.getFullYear());
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() &&
           currentMonth === today.getMonth() + 1 &&
           currentYear === today.getFullYear();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <main className="mx-auto max-w-7xl px-4 py-6 md:py-10">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-lg font-bold text-gray-500 md:text-xl">SGM MOBI</h1>
          <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">SCHEDULE ACTIVATION</h2>
          {cycle && (
            <p className="mt-1 text-sm font-medium text-sgm-red">
              Periode: {cycle}
            </p>
          )}
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end">
          {/* Month Navigation */}
          <div className="flex items-center gap-1 rounded-xl border bg-white px-1 py-1">
            <button
              onClick={goToPrevMonth}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-[140px] text-center text-sm font-semibold text-gray-900">
              {MONTH_NAMES[currentMonth - 1]} {currentYear}
            </span>
            <button
              onClick={goToNextMonth}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={goToToday}
              className="ml-1 flex h-9 items-center gap-1 rounded-lg bg-sgm-red px-3 text-xs font-medium text-white hover:bg-sgm-red-dark transition-colors"
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Today
            </button>
          </div>

          {/* Cycle Filter */}
          <select
            value={cycle}
            onChange={(e) => setCycle(e.target.value)}
            className="h-11 rounded-xl border bg-white px-3 text-sm outline-none focus:border-sgm-red focus:ring-2 focus:ring-sgm-red-light min-w-[130px]"
          >
            <option value="">All Cycles</option>
            <option value="Cycle 1">Cycle 1</option>
            <option value="Cycle 2">Cycle 2</option>
            <option value="Cycle 3">Cycle 3</option>
          </select>

          {/* Region Filter */}
          {canReadRegion && regions && regions.length > 1 && (
            <select
              value={regionId}
              onChange={(e) => setRegionId(e.target.value)}
              className="h-11 rounded-xl border bg-white px-3 text-sm outline-none focus:border-sgm-red focus:ring-2 focus:ring-sgm-red-light min-w-[150px]"
            >
              <option value="">All Regions</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <CardSkeleton />
        ) : isError ? (
          <ErrorState message="Failed to load schedule" onRetry={() => refetch()} />
        ) : !schedule ? (
          <div className="rounded-xl border bg-white p-8 text-center text-gray-500">
            No data available for this period.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
            {/* Table wrapper with horizontal scroll */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b bg-gray-900 text-left text-sm font-semibold text-white">
                    <th className="w-[60px] px-4 py-3.5 text-center">No</th>
                    <th className="w-[100px] px-4 py-3.5">Date</th>
                    <th className="px-4 py-3.5">Venue</th>
                    <th className="px-4 py-3.5">Alamat Venue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {schedule.days.map((day, index) => {
                    const todayHighlight = isToday(day.date);
                    const hasPermits = day.permitters.length > 0;

                    return (
                      <tr
                        key={day.date}
                        className={`
                          ${day.isWeekend
                            ? "bg-red-600 text-white"
                            : todayHighlight
                              ? "bg-green-50"
                              : "bg-white"
                          }
                          ${!day.isWeekend && hasPermits ? "cursor-pointer hover:bg-gray-50" : ""}
                          transition-colors
                        `}
                      >
                        {/* No */}
                        <td className={`px-4 py-3 text-center text-sm ${
                          day.isWeekend ? "text-white" : "text-gray-500"
                        }`}>
                          {index + 1}
                        </td>

                        {/* Date */}
                        <td className={`px-4 py-3 text-sm font-medium ${
                          day.isWeekend
                            ? "text-white"
                            : todayHighlight
                              ? "text-green-800"
                              : "text-gray-900"
                        }`}>
                          <span className="block">{day.date}</span>
                          <span className={`text-xs ${
                            day.isWeekend ? "text-white/80" : "text-gray-400"
                          }`}>
                            {DAY_NAMES[day.dayOfWeek]}
                          </span>
                        </td>

                        {/* Venue */}
                        <td className="px-4 py-3 text-sm">
                          {day.isWeekend ? (
                            <span className="font-medium text-white">Weekend</span>
                          ) : hasPermits ? (
                            <div className="space-y-1.5">
                              {day.permitters.map((p, pIdx) => (
                                <button
                                  key={p.id}
                                  onClick={() => router.push(`/permitters/${p.id}`)}
                                  className={`group flex items-center gap-1.5 text-left font-medium transition-colors ${
                                    todayHighlight ? "text-green-800" : "text-gray-900"
                                  } hover:text-sgm-red`}
                                >
                                  <span>{p.venueName}</span>
                                  <ExternalLink className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>

                        {/* Alamat Venue */}
                        <td className="px-4 py-3 text-sm">
                          {day.isWeekend ? (
                            <span className="text-white/80">-</span>
                          ) : hasPermits ? (
                            <div className="space-y-1.5">
                              {day.permitters.map((p, pIdx) => (
                                <span
                                  key={p.id}
                                  className={`block ${
                                    todayHighlight ? "text-green-700" : "text-gray-600"
                                  }`}
                                >
                                  {p.venueAddress}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
