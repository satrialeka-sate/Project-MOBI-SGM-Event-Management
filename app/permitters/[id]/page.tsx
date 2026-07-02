"use client";

import { use, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, CheckCircle2, XCircle } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import StatusBadge from "@/components/StatusBadge";
import FormSection from "@/components/FormSection";
import ErrorState from "@/components/ErrorState";
import { FormSkeleton } from "@/components/LoadingSkeleton";
import { usePermissions } from "@/hooks/use-permissions";
import { usePermitter, useUpdatePermitter } from "@/hooks/use-permitters";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ViewPermitterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const { canUpdatePermitter } = usePermissions();
  const { data: permitter, isLoading, isError, refetch } = usePermitter(id);
  const updateMutation = useUpdatePermitter();
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/login");
  }, [authStatus, router]);

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

  if (isError || !permitter) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <main className="mx-auto max-w-2xl px-4 py-6 md:py-10">
          <ErrorState message="Permitter not found" onRetry={() => refetch()} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <main className="mx-auto max-w-2xl px-4 py-6 md:py-10">
        <div className="mb-6 flex items-center justify-between">
          <button
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="flex items-center gap-2">
            {permitter.status === "PENDING" && canUpdatePermitter && (
              <>
                <Button
                  size="sm"
                  className="bg-green-600 text-white hover:bg-green-700"
                  onClick={async () => {
                    try {
                      await updateMutation.mutateAsync({
                        id: permitter.id,
                        data: { status: "APPROVED" },
                      });
                      refetch();
                    } catch {
                      // Error handled by mutation onError
                    }
                  }}
                  disabled={updateMutation.isPending}
                >
                  <CheckCircle2 className="mr-1.5 h-4 w-4" /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => setRejectDialogOpen(true)}
                  disabled={updateMutation.isPending}
                >
                  <XCircle className="mr-1.5 h-4 w-4" /> Reject
                </Button>
              </>
            )}
            {canUpdatePermitter && (
              <Button size="sm" variant="outline" onClick={() => router.push(`/permitters/${permitter.id}/edit`)}>
                <Pencil className="mr-1.5 h-4 w-4" /> Edit
              </Button>
            )}
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900 md:text-2xl">{permitter.venueName}</h1>
            <StatusBadge status={permitter.status} />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {new Date(permitter.eventDate).toLocaleDateString()} · {permitter.regionName}
          </p>
        </div>

        <div className="space-y-6">
          <FormSection title="Event Details">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Event Date</p>
                <p className="font-medium text-gray-900">{new Date(permitter.eventDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-gray-500">Region</p>
                <p className="font-medium text-gray-900">{permitter.regionName}</p>
              </div>
              <div>
                <p className="text-gray-500">Cycle</p>
                <p className="font-medium text-gray-900">{permitter.cycle}</p>
              </div>
              <div>
                <p className="text-gray-500">Status</p>
                <StatusBadge status={permitter.status} />
              </div>
            </div>
          </FormSection>

          <FormSection title="Venue">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="col-span-2">
                <p className="text-gray-500">Name</p>
                <p className="font-medium text-gray-900">{permitter.venueName}</p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-500">Address</p>
                <p className="font-medium text-gray-900">{permitter.venueAddress}</p>
              </div>
              <div>
                <p className="text-gray-500">PIC</p>
                <p className="font-medium text-gray-900">{permitter.venuePIC}</p>
              </div>
              <div>
                <p className="text-gray-500">PIC Phone</p>
                <p className="font-medium text-gray-900">{permitter.venuePICPhone}</p>
              </div>
            </div>
          </FormSection>

          <FormSection title="Schools" description={`${permitter.schools.length} school(s)`}>
            {permitter.schools.map((school, index) => (
              <div key={school.id} className="rounded-lg border bg-gray-50 p-4">
                <p className="mb-2 text-sm font-medium text-gray-700">School {index + 1}</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="col-span-2">
                    <p className="text-gray-500">Name</p>
                    <p className="font-medium text-gray-900">{school.name}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-500">Address</p>
                    <p className="font-medium text-gray-900">{school.schoolAddress}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Total Students</p>
                    <p className="font-medium text-gray-900">{school.totalStudents}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">PIC</p>
                    <p className="font-medium text-gray-900">{school.picName}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">PIC Phone</p>
                    <p className="font-medium text-gray-900">{school.picPhone}</p>
                  </div>
                </div>
              </div>
            ))}
          </FormSection>
        </div>
      </main>

      {/* Reject Confirmation Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Permitter</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this permitter? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={async () => {
                try {
                  await updateMutation.mutateAsync({
                    id: permitter!.id,
                    data: { status: "REJECTED" },
                  });
                  setRejectDialogOpen(false);
                  refetch();
                } catch {
                  // Error handled by mutation onError
                }
              }}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Rejecting..." : "Yes, Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
