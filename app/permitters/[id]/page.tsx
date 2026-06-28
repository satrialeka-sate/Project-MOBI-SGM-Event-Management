"use client";

import { use, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import StatusBadge from "@/components/StatusBadge";
import FormSection from "@/components/FormSection";
import ErrorState from "@/components/ErrorState";
import { FormSkeleton } from "@/components/LoadingSkeleton";
import { usePermitter } from "@/hooks/use-permitters";

export default function ViewPermitterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const { data: permitter, isLoading, isError, refetch } = usePermitter(id);

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
          <Button size="sm" onClick={() => router.push(`/permitters/${permitter.id}/edit`)}>
            <Pencil className="mr-1.5 h-4 w-4" /> Edit
          </Button>
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
    </div>
  );
}
