"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, List, Calendar, Building2, Loader2 } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { usePermissions } from "@/hooks/use-permissions";
import { usePermitters } from "@/hooks/use-permitters";
import { useRegions } from "@/hooks/use-regions";

function getRoleBadge(role: string) {
  const styles: Record<string, string> = {
    ADMIN: "bg-purple-100 text-purple-700",
    PERMITTER: "bg-blue-100 text-blue-700",
    SPG: "bg-green-100 text-green-700",
    SUPERVISOR: "bg-yellow-100 text-yellow-700",
  };
  return styles[role] || "bg-gray-100 text-gray-600";
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];
  const {
    canCreatePermitter,
    canReadPermitter,
    canReadEvent,
    canReadAttendance,
  } = usePermissions();

  const { data: regions } = useRegions();
  const userRegion = regions?.find((r) => r.id === session?.user?.regionId);

  const { data: permitterData, isLoading } = usePermitters({
    limit: 1,
    enabled: canReadPermitter,
  });

  // Today's events: permitters with eventDate matching today
  const { data: todayData } = usePermitters({
    limit: 5,
    date: today,
    sortOrder: "asc",
    enabled: canReadPermitter || canReadEvent,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!session?.user) return null;

  const user = session.user;
  const totalPermitters = permitterData?.total ?? 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-4 py-6 md:py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Hello, {user.name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-0.5 text-xs font-medium ${getRoleBadge(user.role || "")}`}
            >
              {user.role}
            </span>
            {userRegion && (
              <span className="rounded-full bg-gray-100 px-3 py-0.5 text-xs font-medium text-gray-600">
                {userRegion.name}
              </span>
            )}
          </div>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          {/* Total Permitters card — only if user can read permitters or events */}
          {(canReadPermitter || canReadEvent) && (
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                  <Building2 className="h-6 w-6 text-blue-600" />
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

          {/* Upcoming Events card — only if user can read events */}
          {canReadEvent && (
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {todayData?.total ?? "-"}
                  </p>
                  <p className="text-sm text-gray-500">Upcoming Events</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SPG-specific stats cards */}
          {canReadAttendance && (
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100">
                  <Calendar className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Attendance & Selling & Contact</p>
                  <p className="text-xs text-gray-400">Module tersedia</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          {canCreatePermitter && (
            <Button
              size="lg"
              className="h-12 flex-1 text-base"
              onClick={() => router.push("/permitters/new")}
            >
              <Plus className="mr-2 h-5 w-5" />
              Create Permitter
            </Button>
          )}
          {canReadPermitter && (
            <Button
              size="lg"
              variant="outline"
              className="h-12 flex-1 text-base"
              onClick={() => router.push("/permitters")}
            >
              <List className="mr-2 h-5 w-5" />
              View Permitters
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
