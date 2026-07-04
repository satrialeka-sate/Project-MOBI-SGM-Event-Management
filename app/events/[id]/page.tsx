"use client";

import { use, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Camera,
  Package,
  Users,
  Loader2,
  Plus,
  Trash2,
  ImageUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import StatusBadge from "@/components/StatusBadge";
import FormSection from "@/components/FormSection";
import ErrorState from "@/components/ErrorState";
import { FormSkeleton } from "@/components/LoadingSkeleton";
import { usePermissions } from "@/hooks/use-permissions";
import { useEvent } from "@/hooks/use-events";
import { useSellingList, useCreateSelling, useDeleteSelling } from "@/hooks/use-sellings";
import { useContactList, useCreateContact, useDeleteContact } from "@/hooks/use-contacts";
import { attendanceApi } from "@/lib/api/attendance";
import {
  useAttendanceList,
  useCreateAttendance,
  useUpdateAttendance,
  useDeleteAttendance,
} from "@/hooks/use-attendance";
import ProductPickerDialog from "@/components/ProductPickerDialog";
import type { ProductItem } from "@/lib/api/product";
import { toast } from "sonner";
import { AxiosError } from "axios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const PREVIOUS_MILK_OPTIONS = [
  { value: "SGM", label: "SGM" },
  { value: "SUSU_BUBUK", label: "Susu Bubuk" },
  { value: "NON_SUSU_BUBUK", label: "Non Susu Bubuk" },
  { value: "NEW_TO_GUM", label: "New to GUM" },
  { value: "OTHERS", label: "Others" },
] as const;

function formatPrice(price: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const {
    canCreateAttendance,
    canDeleteAttendance,
    canCreateSelling,
    canDeleteSelling,
    canCreateContact,
    canDeleteContact,
    canUpdateAttendance,
  } = usePermissions();

  const { data: event, isLoading, isError, refetch } = useEvent(id);
  const { data: attendanceData, refetch: refetchAttendance } = useAttendanceList(id);
  const { data: sellingData, refetch: refetchSelling } = useSellingList(id);
  const { data: contactData, refetch: refetchContact } = useContactList(id);

  // Fetch the current user's own attendance for single-attendance-per-user UX
  const { data: myAttendance, refetch: refetchMyAttendance } = useQuery({
    queryKey: ["my-attendance", id],
    queryFn: () => attendanceApi.getMy(id),
    enabled: !!id && !!canCreateAttendance,
  });

  const createAttendance = useCreateAttendance(id);
  const updateAttendance = useUpdateAttendance(id);
  const deleteAttendance = useDeleteAttendance(id);
  const createSelling = useCreateSelling(id);
  const deleteSelling = useDeleteSelling(id);
  const createContact = useCreateContact(id);
  const deleteContact = useDeleteContact(id);

  // Photo upload state
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  // Selling form state
  const [previousMilk, setPreviousMilk] = useState("SGM");
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [productPickerOpen, setProductPickerOpen] = useState(false);

  // Contact form state
  const [totalContact, setTotalContact] = useState("");

  // Delete confirmation state
  const [deleteAttendanceId, setDeleteAttendanceId] = useState<string | null>(null);
  const [deleteSellingId, setDeleteSellingId] = useState<string | null>(null);
  const [deleteContactId, setDeleteContactId] = useState<string | null>(null);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/login");
    }
  }, [authStatus, router]);

  if (authStatus === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <main className="mx-auto max-w-3xl px-4 py-6 md:py-10">
          <FormSkeleton />
        </main>
      </div>
    );
  }

  if (!session?.user) return null;

  if (isError || !event) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <main className="mx-auto max-w-3xl px-4 py-6 md:py-10">
          <ErrorState message="Event not found" onRetry={() => refetch()} />
        </main>
      </div>
    );
  }

  const eventDate = new Date(event.eventDate);
  const isOngoing = event.status === "ONGOING";

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate MIME type (only images allowed)
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPEG, PNG, and WebP images are allowed.");
      // Clear the input
      e.target.value = "";
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Maximum image size is 5 MB.");
      // Clear the input
      e.target.value = "";
      return;
    }

    setIsUploading(true);

    // Show preview
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const base64 = evt.target?.result as string;
      setPhotoPreview(base64);

      try {
        if (myAttendance) {
          // Update existing attendance (replace photo)
          await updateAttendance.mutateAsync({
            id: myAttendance.id,
            data: { photo: base64 },
          });
          toast.success("Attendance photo updated");
        } else {
          // Create new attendance (first time)
          await createAttendance.mutateAsync({ photo: base64 });
          toast.success("Attendance recorded");
        }

        setPhotoPreview("");
        refetchAttendance();
        refetchMyAttendance();
      } catch (err) {
        const message = err instanceof AxiosError
          ? (err.response?.data?.message || "Failed to upload photo")
          : "Failed to upload photo";
        toast.error(message);
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmitSelling() {
    if (!selectedProduct) {
      toast.error("Please select a product");
      return;
    }

    try {
      await createSelling.mutateAsync({
        previousMilk,
        productId: selectedProduct.id,
      });
      setPreviousMilk("SGM");
      setSelectedProduct(null);
      refetchSelling();
    } catch (err) {
      const message = err instanceof AxiosError
        ? (err.response?.data?.message || "Failed to record selling")
        : "Failed to record selling";
      toast.error(message);
    }
  }

  async function handleSubmitContact() {
    const count = parseInt(totalContact);
    if (isNaN(count) || count < 0) {
      toast.error("Please enter a valid number");
      return;
    }

    try {
      await createContact.mutateAsync({ totalContact: count });
      setTotalContact("");
      refetchContact();
    } catch (err) {
      const message = err instanceof AxiosError
        ? (err.response?.data?.message || "Failed to record contact")
        : "Failed to record contact";
      toast.error(message);
    }
  }

  function formatDateTime(isoString: string): { date: string; time: string } {
    const d = new Date(isoString);
    const date = d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const time = d.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return { date, time: `${time} WIB` };
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 py-6 md:py-10">
        <button
          className="mb-4 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
          onClick={() => router.push("/events")}
        >
          <ArrowLeft className="h-4 w-4" /> Back to Events
        </button>

        {/* Event Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900 md:text-2xl">{event.venueName}</h1>
            <StatusBadge status={event.status} />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {eventDate.toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {event.regionName}
            </span>
          </div>
          {event.permitterName && (
            <p className="mt-1 text-sm text-gray-500">
              Permitter: {event.permitterName}
              {event.spg && ` · SPG: ${event.spg.name}`}
            </p>
          )}
        </div>

        {/* Venue Details */}
        <FormSection title="Venue">
          <div className="text-sm">
            <p className="text-gray-500">Address</p>
            <p className="font-medium text-gray-900">{event.venueAddress}</p>
          </div>
        </FormSection>

        {/* Schools */}
        {event.schools && event.schools.length > 0 && (
          <div className="mt-6">
            <FormSection title="Schools" description={`${event.schools.length} school(s)`}>
              {event.schools.map((school, index) => (
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
                      <p className="text-gray-500">Students</p>
                      <p className="font-medium text-gray-900">{school.totalStudents}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">PIC</p>
                      <p className="font-medium text-gray-900">{school.picName}</p>
                    </div>
                  </div>
                </div>
              ))}
            </FormSection>
          </div>
        )}

        {/* Attendance Section */}
        <div className="mt-6">
          <FormSection title="Attendance">
            {/* My Attendance Status */}
            {myAttendance && (
              <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white">
                    {myAttendance.photo ? (
                      <img src={myAttendance.photo} alt="Your attendance" className="h-full w-full object-cover" />
                    ) : (
                      <Camera className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <p className="text-sm font-medium text-green-700">Attendance Submitted</p>
                    </div>
                    {(() => {
                      const { date, time } = formatDateTime(myAttendance.attendanceAt);
                      return (
                        <>
                          <p className="mt-1 text-sm text-gray-900">{date}</p>
                          <p className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />{time}
                          </p>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* Upload / Update Photo */}
            {canCreateAttendance && isOngoing && (
              <div>
                <Label
                  htmlFor="photo-upload"
                  className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
                    myAttendance
                      ? "border-green-300 bg-green-50/50 hover:border-green-500 hover:bg-green-50"
                      : "border-gray-300 bg-gray-50 hover:border-sgm-red hover:bg-sgm-red-pale"
                  }`}
                >
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="max-h-48 rounded-lg object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-500">
                      <ImageUp className="h-8 w-8" />
                      <span className="text-sm font-medium">
                        {myAttendance ? "Update Attendance Photo" : "Upload Attendance Photo"}
                      </span>
                      <span className="text-xs">System will auto-record date & time</span>
                    </div>
                  )}
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handlePhotoUpload}
                    disabled={isUploading}
                  />
                </Label>
                {isUploading && (
                  <div className="mt-2 flex items-center justify-center gap-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </div>
                )}
              </div>
            )}

            {/* All Attendance History (for admin/supervisor view) */}
            {attendanceData && attendanceData.items.length > 0 && (
              <div className="mt-4 space-y-3">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">All Attendance Records</p>
                {attendanceData.items.map((att) => {
                  const { date, time } = formatDateTime(att.attendanceAt);
                  return (
                    <div key={att.id} className="flex items-start gap-4 rounded-lg border p-4">
                      <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
                        {att.photo ? (
                          <img src={att.photo} alt="Attendance" className="h-full w-full object-cover" />
                        ) : (
                          <Camera className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{date}</p>
                        <p className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          {time}
                        </p>
                        {att.userName && (
                          <p className="text-xs text-gray-500 mt-0.5">{att.userName}</p>
                        )}
                      </div>
                      {canDeleteAttendance && (
                        <button
                          type="button"
                          onClick={() => setDeleteAttendanceId(att.id)}
                          className="flex-shrink-0 rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                          title="Delete attendance"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {(!attendanceData || attendanceData.items.length === 0) && !myAttendance && (
              <p className="py-4 text-center text-sm text-gray-400">
                {isOngoing
                  ? "Upload photo to record attendance"
                  : "No attendance records"}
              </p>
            )}
          </FormSection>
        </div>

        {/* Selling Section */}
        <div className="mt-6">
          <FormSection title="Selling">
            {/* Add Selling Form */}
            {canCreateSelling && isOngoing && (
              <div className="mb-4 space-y-3 rounded-lg border bg-gray-50 p-4">
                <h4 className="text-sm font-medium text-gray-700">Record Selling</h4>

                <div>
                  <Label className="text-xs">Previous Milk</Label>
                  <select
                    value={previousMilk}
                    onChange={(e) => setPreviousMilk(e.target.value)}
                    className="mt-1 h-11 w-full rounded-lg border bg-white px-3 text-sm outline-none focus:border-sgm-red focus:ring-2 focus:ring-sgm-red-light"
                  >
                    {PREVIOUS_MILK_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="text-xs">Product</Label>
                  {selectedProduct ? (
                    <div className="mt-1 flex items-center justify-between rounded-lg border bg-white p-3">
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {selectedProduct.productName}
                        </p>
                        <p className="text-xs text-gray-600">Paket: {selectedProduct.package}</p>
                        <p className="text-xs text-gray-500">Gimmick: {selectedProduct.gimmick}</p>
                        <p className="text-xs font-medium text-gray-700">Harga: {formatPrice(selectedProduct.price)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedProduct(null)}
                        className="ml-2 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setProductPickerOpen(true)}
                      className="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 bg-white text-sm text-gray-500 hover:border-sgm-red hover:text-sgm-red"
                    >
                      <Package className="h-4 w-4" />
                      Select Product
                    </button>
                  )}
                </div>

                <Button
                  type="button"
                  className="w-full"
                  onClick={handleSubmitSelling}
                  disabled={!selectedProduct || createSelling.isPending}
                >
                  {createSelling.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Record Selling
                </Button>
              </div>
            )}

            {/* Selling History */}
            {sellingData && sellingData.items.length > 0 ? (
              <div className="space-y-2">
                {sellingData.items.map((sell) => (
                  <div key={sell.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {sell.productName}
                      </p>
                      <p className="text-xs text-gray-600">Paket: {sell.package}</p>
                      <p className="text-xs text-gray-500">
                        {sell.previousMilk} · {sell.gimmick} · {formatPrice(sell.price)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">
                        {new Date(sell.sellingDate).toLocaleDateString("id-ID")}
                      </span>
                      {canDeleteSelling && (
                        <button
                          type="button"
                          onClick={() => setDeleteSellingId(sell.id)}
                          className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                          title="Delete selling"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-gray-400">
                {isOngoing
                  ? "Record selling data above"
                  : "No selling records"}
              </p>
            )}
          </FormSection>
        </div>

        {/* Contact Section */}
        <div className="mt-6">
          <FormSection title="Contact">
            {/* Add Contact Form */}
            {canCreateContact && isOngoing && (
              <div className="mb-4 space-y-3 rounded-lg border bg-gray-50 p-4">
                <h4 className="text-sm font-medium text-gray-700">Record Contact</h4>

                <div>
                  <Label className="text-xs">Total Contact</Label>
                  <Input
                    type="number"
                    min="0"
                    value={totalContact}
                    onChange={(e) => setTotalContact(e.target.value)}
                    placeholder="e.g. 50"
                    className="mt-1 h-11"
                  />
                </div>

                <Button
                  type="button"
                  className="w-full"
                  onClick={handleSubmitContact}
                  disabled={!totalContact || createContact.isPending}
                >
                  {createContact.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Record Contact
                </Button>
              </div>
            )}

            {/* Contact History */}
            {contactData && contactData.items.length > 0 ? (
              <div className="space-y-2">
                {contactData.items.map((contact) => (
                  <div key={contact.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sgm-red-light">
                        <Users className="h-5 w-5 text-sgm-red" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {contact.totalContact} contacts
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(contact.contactDate).toLocaleDateString("id-ID")}
                        </p>
                      </div>
                    </div>
                    {canDeleteContact && (
                      <button
                        type="button"
                        onClick={() => setDeleteContactId(contact.id)}
                        className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                        title="Delete contact"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-gray-400">
                {isOngoing
                  ? "Record contact data above"
                  : "No contact records"}
              </p>
            )}
          </FormSection>
        </div>

        {/* Back button */}
        <div className="mt-6">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push("/events")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Events
          </Button>
        </div>
      </main>

      {/* Product Picker Dialog */}
      <ProductPickerDialog
        open={productPickerOpen}
        onOpenChange={setProductPickerOpen}
        onSelect={(product) => setSelectedProduct(product)}
      />

      {/* Delete Attendance Confirmation Dialog */}
      <Dialog open={!!deleteAttendanceId} onOpenChange={(open) => !open && setDeleteAttendanceId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete Record
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteAttendanceId(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!deleteAttendanceId) return;
                try {
                  await deleteAttendance.mutateAsync(deleteAttendanceId);
                  setDeleteAttendanceId(null);
                  refetchAttendance();
                  refetchMyAttendance();
                } catch {
                  // Error handled by mutation onError
                }
              }}
              disabled={deleteAttendance.isPending}
            >
              {deleteAttendance.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Selling Confirmation Dialog */}
      <Dialog open={!!deleteSellingId} onOpenChange={(open) => !open && setDeleteSellingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete Record
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteSellingId(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!deleteSellingId) return;
                try {
                  await deleteSelling.mutateAsync(deleteSellingId);
                  setDeleteSellingId(null);
                  refetchSelling();
                } catch {
                  // Error handled by mutation onError
                }
              }}
              disabled={deleteSelling.isPending}
            >
              {deleteSelling.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Contact Confirmation Dialog */}
      <Dialog open={!!deleteContactId} onOpenChange={(open) => !open && setDeleteContactId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete Record
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteContactId(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!deleteContactId) return;
                try {
                  await deleteContact.mutateAsync(deleteContactId);
                  setDeleteContactId(null);
                  refetchContact();
                } catch {
                  // Error handled by mutation onError
                }
              }}
              disabled={deleteContact.isPending}
            >
              {deleteContact.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
