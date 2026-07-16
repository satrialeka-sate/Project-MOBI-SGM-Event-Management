"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ClipboardList, CalendarRange, ChevronRight, MapPin, ClipboardCheck } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { usePermissions } from "@/hooks/use-permissions";
import { useRegions } from "@/hooks/use-regions";
import { formatBusinessRole } from "@/lib/format-business-role";
import { UserRole } from "@/constants/prisma-enums";
import { USER_LEVELS } from "@/constants/user-level";

const NAV_ITEMS = [
  {
    key: "permitter",
    title: "Permitter",
    description: "Kelola permitter event",
    icon: ClipboardList,
    href: "/permitters",
    permission: "canReadPermitter" as const,
  },
  {
    key: "schedule",
    title: "Schedule",
    description: "Lihat jadwal seluruh event",
    icon: CalendarRange,
    href: "/schedule",
    permission: "canReadSchedule" as const,
  },
  {
    key: "survey",
    title: "Survey",
    description: "Survey customer dan lihat report",
    icon: ClipboardCheck,
    href: "/survey",
    permission: "canReadSurvey" as const,
  },
] as const;

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const {
    canReadPermitter,
    canReadSchedule,
    canReadSurvey,
  } = usePermissions();
  const { data: regions } = useRegions();

  const permissions = { canReadPermitter, canReadSchedule, canReadSurvey };

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

  const user = session.user;
  // businessRole is available at runtime from auth.ts — cast for type safety
  const roleLabel = formatBusinessRole(
    (user as { businessRole?: string }).businessRole,
    user.role,
    user.level
  );

  const isAdminPO =
    user.role === UserRole.ADMIN &&
    user.level === USER_LEVELS.PO;

  const userRegion = regions?.find((r) => r.id === user.regionId);

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <main className="mx-auto max-w-2xl px-4 py-6 md:py-10">
        {/* Greeting */}
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-gray-900">
            Hello, {user.name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full bg-sgm-red px-3 py-1 text-xs font-medium text-white">
              {roleLabel}
            </span>
            {!isAdminPO && userRegion && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                <MapPin className="h-3 w-3" />
                {userRegion.name}
              </span>
            )}
          </div>
        </div>

        {/* Main Menu Title */}
        <div className="mb-4 text-center">
          <h2 className="text-xl font-bold text-gray-900">
            Main Menu
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Pilih menu yang tersedia
          </p>
        </div>

        {/* Navigation Cards */}
        <nav className="flex flex-col gap-5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            if (!permissions[item.permission]) return null;

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
