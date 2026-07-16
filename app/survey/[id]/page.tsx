"use client";

import { use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ClipboardCheck } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import FormSection from "@/components/FormSection";
import ErrorState from "@/components/ErrorState";
import { FormSkeleton } from "@/components/LoadingSkeleton";
import { usePermissions } from "@/hooks/use-permissions";
import { useSurvey } from "@/hooks/use-survey";
import {
  SURVEY_PROFESSION_LABELS,
  SURVEY_NOT_BUYING_REASON_LABELS,
  SURVEY_BUYING_REASON_LABELS,
  SURVEY_PACKAGE_LABELS,
  SURVEY_FAVORITE_ACTIVITY_LABELS,
  SURVEY_MEMORABLE_IMPRESSION_LABELS,
  SURVEY_CREW_IMPRESSION_LABELS,
} from "@/constants/survey-enums";

const QUESTIONS = [
  { key: "profession", label: "Apakah Profesi Bunda?", labels: SURVEY_PROFESSION_LABELS },
  { key: "notBuyingReason", label: "Jika tidak membeli, apa alasan Bunda?", labels: SURVEY_NOT_BUYING_REASON_LABELS },
  { key: "buyingReason", label: "Apa yang membuat Bunda membeli produk SGM Eksplor?", labels: SURVEY_BUYING_REASON_LABELS },
  { key: "package", label: "Paket yang Bunda beli di acara ini", labels: SURVEY_PACKAGE_LABELS },
  { key: "favoriteActivity", label: "Aktivitas apa yang paling disukai selama event?", labels: SURVEY_FAVORITE_ACTIVITY_LABELS },
  { key: "memorableImpression", label: "Kesan yang paling diingat dari Event SGM Ruang Tumbuh Lebih", labels: SURVEY_MEMORABLE_IMPRESSION_LABELS },
  { key: "crewImpression", label: "Bagaimana kesan Bunda terhadap Kru (Man Power) Event?", labels: SURVEY_CREW_IMPRESSION_LABELS },
] as const;

export default function SurveyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const { canReadSurvey } = usePermissions();
  const { data: survey, isLoading, isError, refetch } = useSurvey(id);

  if (authStatus === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <main className="mx-auto max-w-2xl px-4 py-6 md:py-10">
          <FormSkeleton />
        </main>
      </div>
    );
  }

  if (!session?.user) return null;

  if (isError || !survey) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <main className="mx-auto max-w-2xl px-4 py-6 md:py-10">
          <ErrorState message="Survey tidak ditemukan" onRetry={() => refetch()} />
        </main>
      </div>
    );
  }

  function getAnswerLabel(key: string, value: string): string {
    const question = QUESTIONS.find((q) => q.key === key);
    if (!question) return value;
    const labels = question.labels as Record<string, string>;
    return labels[value] || value;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <main className="mx-auto max-w-2xl px-4 py-6 md:py-10">
        <button
          className="mb-4 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
          onClick={() => router.push("/survey")}
        >
          <ArrowLeft className="h-4 w-4" /> Back to Survey
        </button>

        <div className="mb-6 flex items-center gap-3">
          <ClipboardCheck className="h-6 w-6 text-sgm-red" />
          <div>
            <h1 className="text-xl font-bold text-gray-900 md:text-2xl">Detail Survey</h1>
            <p className="text-sm text-gray-500">
              {survey.eventName} · {new Date(survey.surveyDate).toLocaleDateString("id-ID")}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <FormSection title="Informasi">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Event</p>
                <p className="font-medium text-gray-900">{survey.eventName}</p>
              </div>
              <div>
                <p className="text-gray-500">Region</p>
                <p className="font-medium text-gray-900">{survey.regionName}</p>
              </div>
              <div>
                <p className="text-gray-500">Tanggal Survey</p>
                <p className="font-medium text-gray-900">
                  {new Date(survey.surveyDate).toLocaleDateString("id-ID")}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Diisi oleh</p>
                <p className="font-medium text-gray-900">{survey.createdByName}</p>
              </div>
            </div>
          </FormSection>

          {QUESTIONS.map((q) => {
            const value = (survey as any)[q.key] as string;
            return (
              <FormSection key={q.key} title={q.label}>
                <div className="rounded-lg border bg-gray-50 p-4">
                  <p className="font-medium text-gray-900">
                    {getAnswerLabel(q.key, value)}
                  </p>
                </div>
              </FormSection>
            );
          })}
        </div>
      </main>
    </div>
  );
}
