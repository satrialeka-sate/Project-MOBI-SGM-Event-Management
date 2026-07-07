"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Building2, Loader2, CalendarDays, ClipboardList, CalendarRange } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { usePermissions } from "@/hooks/use-permissions";
import { usePermitters } from "@/hooks/use-permitters";
import { useEvents } from "@/hooks/use-events";
import { formatRoleLabel } from "@/lib/format-role-label";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];
  const {
    canCreatePermitter,
    canReadPermitter,
    canReadEvent,
    canReadAttendance,
    canReadSchedule,
  } = usePermissions();

  const { data: permitterData, isLoading } = usePermitters({
    limit: 1,
    enabled: canReadPermitter,
  });

  // Dashboard uses Event data (not Permitter) for event counts
  const { data: eventsTodayData } = useEvents({
    limit: 5,
    status: "ONGOING",
    sortOrder: "asc",
    enabled: canReadEvent,
  });

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
  const totalPermitters = permitterData?.total ?? 0;
  const roleLabel = formatRoleLabel(user.role, user.level);

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-4 py-6 md:py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Hello, {user.name}
          </h1>
          <div className="mt-2">
            <span className="inline-flex rounded-full bg-sgm-red px-3 py-1 text-xs font-medium text-white">
              {roleLabel}
            </span>
          </div>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          {(canReadPermitter || canReadEvent) && (
            <Card className="border-sgm-red/20 bg-sgm-red-pale">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sgm-red-light">
                  <Building2 className="h-6 w-6 text-sgm-red" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {isLoading ? "-" : totalPermitters}
                  </p>
                  <p className="text-sm text-gray-500">Total Permitters</p>
                </div>
              </CardContent>
            </Card>
          )}

          {canReadEvent && (
            <Card className="border-sgm-red/20 bg-sgm-red-pale">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sgm-red-light">
                  <Calendar className="h-6 w-6 text-sgm-red" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {eventsTodayData?.total ?? "-"}
                  </p>
                  <p className="text-sm text-gray-500">Today&apos;s Events</p>
                </div>
              </CardContent>
            </Card>
          )}

          {canReadAttendance && (
            <Card className="border-sgm-red/20 bg-sgm-red-pale">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sgm-red-light">
                  <Calendar className="h-6 w-6 text-sgm-red" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Attendance & Selling & Contact
                  </p>
                  <p className="text-xs text-gray-400">Module tersedia</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          {canReadPermitter && (
            <Button
              size="lg"
              variant="outline"
              className="h-12 flex-1 border-sgm-red text-base text-sgm-red hover:bg-sgm-red-pale hover:text-sgm-red-dark"
              onClick={() => router.push("/permitters")}
            >
              <ClipboardList className="mr-2 h-5 w-5" />
              Permitter
            </Button>
          )}
          {canReadSchedule && (
            <Button
              size="lg"
              variant="outline"
              className="h-12 flex-1 border-sgm-red text-base text-sgm-red hover:bg-sgm-red-pale hover:text-sgm-red-dark"
              onClick={() => router.push("/schedule")}
            >
              <CalendarRange className="mr-2 h-5 w-5" />
              Schedule
            </Button>
          )}
          {canReadEvent && (
            <Button
              size="lg"
              className="h-12 flex-1 bg-sgm-red text-base text-white hover:bg-sgm-red-dark"
              onClick={() => router.push("/events")}
            >
              <CalendarDays className="mr-2 h-5 w-5" />
              Event
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
