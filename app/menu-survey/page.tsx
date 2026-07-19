"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ClipboardCheck, BarChart3, FileText, ChevronRight, ChevronLeft } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { usePermissions } from "@/hooks/use-permissions";

const SUB_MENU_ITEMS = [
  {
    key: "input-survey",
    title: "Input Survey",
    description: "Input hasil survey customer",
    icon: ClipboardCheck,
    href: "/survey/new",
    permission: "canCreateSurvey" as const,
  },
  {
    key: "rekap-survey",
    title: "Rekap Survey",
    description: "Lihat seluruh data survey",
    icon: FileText,
    href: "/survey",
    permission: "canReadSurvey" as const,
  },
  {
    key: "report-survey",
    title: "Report Survey",
    description: "Lihat visualisasi dan analisis hasil survey",
    icon: BarChart3,
    href: "/survey/report",
    permission: "canReadSurvey" as const,
  } as const,
] as const;

export default function MenuSurveyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const {
    canCreateSurvey,
    canReadSurvey,
    canReadSurveyRegion,
    canReadSurveyAll,
  } = usePermissions();

  const permissions = { canCreateSurvey, canReadSurvey };
  const canViewReport = canReadSurveyRegion || canReadSurveyAll;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
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
      <main className="mx-auto max-w-2xl px-4 py-6 md:py-10">
        {/* Back Button */}
        <button
          className="mb-6 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          onClick={() => router.push("/dashboard")}
        >
          <ChevronLeft className="h-4 w-4" />
          Kembali
        </button>

        {/* Page Title */}
        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold text-gray-900">
            Menu Survey
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Pilih menu yang tersedia
          </p>
        </div>

        {/* Sub Menu Cards */}
        <nav className="flex flex-col gap-5">
          {SUB_MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            // Report Survey hanya tampil untuk role yang punya akses (Admin/Supervisor)
            const hasAccess = item.key === "report-survey"
              ? canViewReport
              : !!permissions[item.permission];
            if (!hasAccess) return null;

            return (
              <Card
                key={item.key}
                className="cursor-pointer border border-gray-200 transition-all duration-200 hover:-translate-y-1 hover:border-sgm-red hover:shadow-lg active:scale-[0.98]"
                onClick={() => router.push(item.href)}
              >
                <CardContent className="flex items-center gap-5 p-6">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-sgm-red-light">
                    <Icon className="h-7 w-7 text-sgm-red" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-semibold text-gray-900">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-sm text-gray-500">
                      {item.description}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-gray-400" />
                </CardContent>
              </Card>
            );
          })}
        </nav>
      </main>
    </div>
  );
}
