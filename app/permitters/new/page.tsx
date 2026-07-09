"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AxiosError } from "axios";
import { Loader2, Plus, Trash2, ArrowLeft, Save, MapPin, AlertTriangle, Info } from "lucide-react";
import { getCycleFromDate } from "@/lib/cycle";
import AppHeader from "@/components/AppHeader";
import FormSection from "@/components/FormSection";
import BottomActionBar from "@/components/BottomActionBar";
import { usePermissions } from "@/hooks/use-permissions";
import { useCreatePermitter } from "@/hooks/use-permitters";
import { useRegions } from "@/hooks/use-regions";

const schoolSchema = z.object({
  name: z.string().min(1, "School name is required"),
  schoolAddress: z.string().min(1, "Address is required"),
  totalStudents: z.string().regex(/^\d+$/, "Must be a positive number"),
  picName: z.string().min(1, "PIC name is required"),
  picPhone: z.string().min(8, "Minimum 8 characters").max(15),
});

const formSchema = z.object({
  eventDate: z.string().min(1, "Date is required"),
  venueName: z.string().min(1, "Venue name is required"),
  venueAddress: z.string().min(1, "Address is required"),
  venuePIC: z.string().min(1, "PIC name is required"),
  venuePICPhone: z
    .string()
    .min(8, "Minimum 8 characters")
    .max(20, "Maximum 20 characters"),
  schools: z.array(schoolSchema).min(1, "At least 1 school").max(3, "Maximum 3 schools"),
});

type FormData = z.infer<typeof formSchema>;

export default function CreatePermitterPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const { canCreatePermitter } = usePermissions();
  const createMutation = useCreatePermitter();
  const { data: regions } = useRegions();
  const [submitError, setSubmitError] = useState("");

  const userRegion = regions?.find((r) => r.id === session?.user?.regionId);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      venueName: "",
      venueAddress: "",
      venuePIC: "",
      venuePICPhone: "",
      eventDate: new Date().toISOString().split("T")[0],
      schools: [{ name: "", schoolAddress: "", totalStudents: "0", picName: "", picPhone: "" }],
    },
  });

  const watchedEventDate = watch("eventDate");

  const cycleInfo = watchedEventDate
    ? getCycleFromDate(new Date(watchedEventDate + "T00:00:00.000Z"))
    : null;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "schools",
  });

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (authStatus === "authenticated" && !canCreatePermitter) {
      router.push("/dashboard");
    }
  }, [authStatus, router, canCreatePermitter]);

  if (authStatus === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const onSubmit: Parameters<typeof handleSubmit>[0] = async (data) => {
    setSubmitError("");
    try {
      await createMutation.mutateAsync({
        permitterId: session?.user?.id || "",
        regionId: session?.user?.regionId || "",
        eventDate: new Date(data.eventDate).toISOString(),
        venueName: data.venueName,
        venueAddress: data.venueAddress,
        venuePIC: data.venuePIC,
        venuePICPhone: data.venuePICPhone,
        schools: data.schools.map((s) => ({
          ...s,
          totalStudents: Number(s.totalStudents),
        })),
      });
      router.push("/permitters");
    } catch (err) {
      if (err instanceof AxiosError) {
        setSubmitError(err.response?.data?.message || "Failed to create permitter");
      } else {
        setSubmitError("An unexpected error occurred");
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <main className="mx-auto max-w-2xl px-4 py-6 pb-28 md:py-10 md:pb-10">
        <button
          className="mb-4 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <h1 className="mb-6 text-xl font-bold text-gray-900 md:text-2xl">Create Permitter</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Assignment Information Card */}
          <div className="rounded-xl border border-primary-muted bg-primary-subtle/50 p-4 shadow-sm md:p-5">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-muted">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Assignment Information</h3>
            </div>
            <div className="space-y-3 pl-10">
              <div>
                <p className="text-xs font-medium text-gray-500">Region</p>
                <p className="text-sm font-semibold text-gray-900">
                  {userRegion?.name || session?.user?.regionId || "-"}
                </p>
              </div>
            </div>
            <p className="mt-2 pl-10 text-xs text-gray-400">
              This region is automatically determined from your account.
            </p>
          </div>

          {/* Event Details */}
          <FormSection title="Event Details" description="Basic event information">
            <div className="space-y-2">
              <Label htmlFor="eventDate">Event Date</Label>
              <Input id="eventDate" type="date" {...register("eventDate")} className="h-11" />
              {errors.eventDate && <p className="text-sm text-red-500">{errors.eventDate.message}</p>}
            </div>

            {/* Cycle preview - read-only, computed from Event Date */}
            {watchedEventDate && (
              <div className="rounded-lg border bg-gray-50 p-3">
                {cycleInfo ? (
                  <div className="flex items-start gap-2">
                    <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        <span className="font-semibold">{cycleInfo}</span>
                      </p>
                      <p className="text-xs text-gray-500">Otomatis berdasarkan Event Date</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Outside Cycle</p>
                      <p className="text-xs text-amber-600">Tanggal ini berada di luar periode Cycle.</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </FormSection>

          {/* Venue Details */}
          <FormSection title="Venue Details" description="Venue information">
            <div className="space-y-2">
              <Label htmlFor="venueName">Venue Name</Label>
              <Input id="venueName" placeholder="e.g. GOR Cirebon" {...register("venueName")} className="h-11" />
              {errors.venueName && <p className="text-sm text-red-500">{errors.venueName.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="venueAddress">Venue Address</Label>
              <Textarea id="venueAddress" placeholder="Full address" {...register("venueAddress")} className="min-h-[80px]" />
              {errors.venueAddress && <p className="text-sm text-red-500">{errors.venueAddress.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="venuePIC">Venue PIC</Label>
              <Input id="venuePIC" placeholder="Contact person name" {...register("venuePIC")} className="h-11" />
              {errors.venuePIC && <p className="text-sm text-red-500">{errors.venuePIC.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="venuePICPhone">Venue PIC Phone</Label>
              <Input id="venuePICPhone" placeholder="e.g. 08123456789" type="tel" {...register("venuePICPhone")} className="h-11" />
              {errors.venuePICPhone && <p className="text-sm text-red-500">{errors.venuePICPhone.message}</p>}
            </div>
          </FormSection>

          {/* Schools */}
          <FormSection
            title="Schools"
            description={`Add 1 to 3 schools (${fields.length}/3)`}
          >
            {fields.map((field, index) => (
              <div key={field.id} className="rounded-lg border bg-gray-50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">School {index + 1}</span>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">School Name</Label>
                    <Input {...register(`schools.${index}.name`)} placeholder="School name" className="h-11" />
                    {errors.schools?.[index]?.name && <p className="text-xs text-red-500">{errors.schools[index]?.name?.message}</p>}
                  </div>
                  <div>
                    <Label className="text-xs">Address</Label>
                    <Input {...register(`schools.${index}.schoolAddress`)} placeholder="School address" className="h-11" />
                    {errors.schools?.[index]?.schoolAddress && <p className="text-xs text-red-500">{errors.schools[index]?.schoolAddress?.message}</p>}
                  </div>
                  <div>
                    <Label className="text-xs">Total Students</Label>
                    <Input {...register(`schools.${index}.totalStudents`)} type="number" placeholder="e.g. 120" className="h-11" />
                    {errors.schools?.[index]?.totalStudents && <p className="text-xs text-red-500">{errors.schools[index]?.totalStudents?.message}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">PIC Name</Label>
                      <Input {...register(`schools.${index}.picName`)} placeholder="PIC name" className="h-11" />
                      {errors.schools?.[index]?.picName && <p className="text-xs text-red-500">{errors.schools[index]?.picName?.message}</p>}
                    </div>
                    <div>
                      <Label className="text-xs">PIC Phone</Label>
                      <Input {...register(`schools.${index}.picPhone`)} placeholder="Phone" type="tel" className="h-11" />
                      {errors.schools?.[index]?.picPhone && <p className="text-xs text-red-500">{errors.schools[index]?.picPhone?.message}</p>}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {fields.length < 3 && (
              <Button
                type="button"
                variant="outline"
                className="mt-2 h-11 w-full"
                onClick={() => append({ name: "", schoolAddress: "", totalStudents: "0", picName: "", picPhone: "" })}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add School
              </Button>
            )}

            {errors.schools?.message && typeof errors.schools.message === "string" && (
              <p className="mt-1 text-sm text-red-500">{errors.schools.message}</p>
            )}
          </FormSection>

          {submitError && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {submitError}
            </div>
          )}

          {/* Desktop buttons */}
          <div className="hidden gap-3 md:flex">
            <Button type="button" variant="outline" className="h-11 flex-1" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" className="h-11 flex-1" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save
            </Button>
          </div>

          <BottomActionBar onCancel={() => router.back()} isSubmitting={isSubmitting} submitLabel="Save" />
        </form>
      </main>
    </div>
  );
}
