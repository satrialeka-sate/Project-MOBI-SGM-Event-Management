"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Eye, Calendar, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import StatusBadge from "@/components/StatusBadge";
import SearchBar from "@/components/SearchBar";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";
import { TableSkeleton, CardSkeleton } from "@/components/LoadingSkeleton";
import { useEvents } from "@/hooks/use-events";
import { usePermissions } from "@/hooks/use-permissions";
import { useRegions } from "@/hooks/use-regions";

const STATUS_TABS = [
  { label: "Today", value: "ONGOING" },
  { label: "Upcoming", value: "UPCOMING" },
  { label: "Completed", value: "COMPLETED" },
] as const;

export default function EventsPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");
  const [regionId, setRegionId] = useState<string>("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const { canReadEvent, canReadRegion } = usePermissions();
  const { data: regions } = useRegions();
  const { data, isLoading, isError, refetch } = useEvents({
    page,
    limit,
    search: search || undefined,
    status: status || undefined,
    regionId: regionId || undefined,
    sortBy: "eventDate",
    sortOrder: "desc",
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

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-6 md:py-10">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900 md:text-2xl">Events</h1>
        </div>

        {/* Status Filter Tabs */}
        <div className="mb-4 flex gap-2 overflow-x-auto">
          <button
            onClick={() => { setStatus(""); setPage(1); }}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              !status
                ? "bg-sgm-red text-white"
                : "bg-white text-gray-600 hover:bg-gray-100 border"
            }`}
          >
            All
          </button>
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setStatus(tab.value); setPage(1); }}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                status === tab.value
                  ? "bg-sgm-red text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100 border"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <SearchBar
              value={search}
              onChange={(v) => { setSearch(v); setPage(1); }}
              placeholder="Search venue or region..."
            />
          </div>
          {canReadRegion && regions && regions.length > 1 && (
            <select
              value={regionId}
              onChange={(e) => { setRegionId(e.target.value); setPage(1); }}
              className="h-11 rounded-xl border bg-white px-3 text-sm outline-none focus:border-sgm-red focus:ring-2 focus:ring-sgm-red-light"
            >
              <option value="">ALL REGION</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          )}
        </div>

        {isLoading ? (
          <>
            <TableSkeleton />
            <CardSkeleton />
          </>
        ) : isError ? (
          <ErrorState message="Failed to load events" onRetry={() => refetch()} />
        ) : !data || data.items.length === 0 ? (
          <EmptyState
            title="No events found"
            description={search ? "Try a different search term." : "Events will appear here once permitters are approved."}
          />
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden overflow-hidden rounded-xl border bg-white md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-sm font-medium text-gray-500">
                    <th className="px-6 py-3">Event Date</th>
                    <th className="px-6 py-3">Venue</th>
                    <th className="px-6 py-3">Region</th>
                    <th className="px-6 py-3">Permitter</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.items.map((e) => (
                    <tr key={e.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">
                        {new Date(e.eventDate).toLocaleDateString("id-ID")}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {e.venueName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {e.regionName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {e.permitterName}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={e.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/events/${e.id}`)}
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
              {data.items.map((e) => (
                <div
                  key={e.id}
                  className="rounded-xl border bg-white p-4 shadow-sm cursor-pointer active:scale-[0.99] transition-transform"
                  onClick={() => router.push(`/events/${e.id}`)}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-sgm-red" />
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(e.eventDate).toLocaleDateString("id-ID")}
                      </span>
                    </div>
                    <StatusBadge status={e.status} />
                  </div>
                  <div className="space-y-1 text-sm text-gray-500">
                    <p className="font-medium text-gray-900">{e.venueName}</p>
                    <p>{e.regionName} · {e.permitterName}</p>
                  </div>
                  <div className="mt-3 flex justify-end border-t pt-3">
                    <Button variant="outline" size="sm" className="text-xs">
                      <Eye className="mr-1 h-3.5 w-3.5" /> View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {data.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between rounded-xl border bg-white px-4 py-3">
                <span className="text-sm text-gray-500">
                  Page {data.page} of {data.totalPages}
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
