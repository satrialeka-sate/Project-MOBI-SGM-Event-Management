"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import SearchBar from "@/components/SearchBar";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";
import { TableSkeleton, CardSkeleton } from "@/components/LoadingSkeleton";
import { usePermitters } from "@/hooks/use-permitters";
import { usePermissions } from "@/hooks/use-permissions";


export default function PermittersPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const {
    canCreatePermitter,
  } = usePermissions();

  const { data, isLoading, isError, refetch } = usePermitters({
    page,
    limit,
    search: search || undefined,
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session?.user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-6 md:py-10">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-bold text-gray-900 md:text-2xl">Permitters</h1>
          {canCreatePermitter && (
            <Button onClick={() => router.push("/permitters/new")} className="h-11 w-full bg-sgm-red text-white hover:bg-sgm-red-dark sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Create Permitter
            </Button>
          )}
        </div>
          
        <div className="mb-4">
          <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} />
        </div>

        {isLoading ? (
          <>
            <TableSkeleton />
            <CardSkeleton />
          </>
        ) : isError ? (
          <ErrorState message="Failed to load permitters" onRetry={() => refetch()} />
        ) : !data || data.items.length === 0 ? (
          <EmptyState
            title="No permitters found"
            description={search ? "Try a different search term." : "Create your first permitter to get started."}
            actionLabel={search ? undefined : (canCreatePermitter ? "Create Permitter" : undefined)}
            actionHref={search ? undefined : (canCreatePermitter ? "/permitters/new" : undefined)}
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
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.items.map((p) => (
                    <tr key={p.id} className="cursor-pointer hover:bg-gray-50" onClick={() => router.push(`/permitters/${p.id}`)}>
                      <td className="px-6 py-4 text-sm">
                        {new Date(p.eventDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {p.venueName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{p.regionName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="space-y-3 md:hidden">
              {data.items.map((p) => (
                <div key={p.id} className="cursor-pointer rounded-xl border bg-white p-4 shadow-sm hover:bg-gray-50" onClick={() => router.push(`/permitters/${p.id}`)}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(p.eventDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-gray-500">
                    <p><span className="font-medium text-gray-700">Venue:</span> {p.venueName}</p>
                    <p><span className="font-medium text-gray-700">Region:</span> {p.regionName}</p>
                  </div>
                  <div className="mt-2 text-xs text-gray-400">Cycle: {p.cycle}</div>
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
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>
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
