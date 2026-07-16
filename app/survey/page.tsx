"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, BarChart3, ClipboardCheck, Loader2, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import SearchBar from "@/components/SearchBar";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";
import { TableSkeleton, CardSkeleton } from "@/components/LoadingSkeleton";
import { usePermissions } from "@/hooks/use-permissions";
import { useSurveys } from "@/hooks/use-survey";
import {
  SURVEY_PROFESSION_LABELS,
  SURVEY_PACKAGE_LABELS,
} from "@/constants/survey-enums";

export default function SurveyPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const limit = 20;

  const { canCreateSurvey, canReadSurvey, canReadSurveyRegion, canReadSurveyAll } = usePermissions();
  const { data, isLoading, isError, refetch } = useSurveys({
    page,
    limit,
    enabled: canReadSurvey,
  });

  const canViewReport = canReadSurveyRegion || canReadSurveyAll;

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

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-6 md:py-10">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-bold text-gray-900 md:text-2xl">Survey</h1>
          <div className="flex gap-2">
            {canViewReport && (
              <Button
                variant="outline"
                className="h-11"
                onClick={() => router.push("/survey/report")}
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Report
              </Button>
            )}
            {canCreateSurvey && (
              <Button
                className="h-11 bg-sgm-red text-white hover:bg-sgm-red-dark"
                onClick={() => router.push("/survey/new")}
              >
                <Plus className="mr-2 h-4 w-4" />
                New Survey
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <>
            <TableSkeleton />
            <CardSkeleton />
          </>
        ) : isError ? (
          <ErrorState message="Gagal memuat survey" onRetry={() => refetch()} />
        ) : !data || data.items.length === 0 ? (
          <EmptyState
            title="Belum ada survey"
            description="Survey akan muncul setelah SPG mengisi data survey."
            actionLabel={canCreateSurvey ? "Buat Survey Baru" : undefined}
            actionHref={canCreateSurvey ? "/survey/new" : undefined}
          />
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden overflow-hidden rounded-xl border bg-white md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-sm font-medium text-gray-500">
                    <th className="px-6 py-3">Tanggal</th>
                    <th className="px-6 py-3">Event</th>
                    <th className="px-6 py-3">Region</th>
                    <th className="px-6 py-3">Profesi</th>
                    <th className="px-6 py-3">Paket</th>
                    <th className="px-6 py-3">Oleh</th>
                    <th className="px-6 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.items.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">
                        {new Date(s.surveyDate).toLocaleDateString("id-ID")}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {s.eventName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{s.regionName}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {SURVEY_PROFESSION_LABELS[s.profession as keyof typeof SURVEY_PROFESSION_LABELS] || s.profession}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {SURVEY_PACKAGE_LABELS[s.package as keyof typeof SURVEY_PACKAGE_LABELS] || s.package}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{s.createdByName}</td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/survey/${s.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="space-y-3 md:hidden">
              {data.items.map((s) => (
                <div
                  key={s.id}
                  className="rounded-xl border bg-white p-4 shadow-sm cursor-pointer active:scale-[0.99] transition-transform"
                  onClick={() => router.push(`/survey/${s.id}`)}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(s.surveyDate).toLocaleDateString("id-ID")}
                    </span>
                    <ClipboardCheck className="h-4 w-4 text-sgm-red" />
                  </div>
                  <div className="space-y-1 text-sm text-gray-500">
                    <p><span className="font-medium text-gray-700">Event:</span> {s.eventName}</p>
                    <p><span className="font-medium text-gray-700">Region:</span> {s.regionName}</p>
                    <p><span className="font-medium text-gray-700">Oleh:</span> {s.createdByName}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {data.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between rounded-xl border bg-white px-4 py-3">
                <span className="text-sm text-gray-500">
                  Halaman {data.page} dari {data.totalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= data.totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
