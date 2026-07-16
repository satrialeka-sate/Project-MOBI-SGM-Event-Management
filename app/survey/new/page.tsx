"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, Send, ClipboardCheck } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import FormSection from "@/components/FormSection";
import { usePermissions } from "@/hooks/use-permissions";
import { useEvents } from "@/hooks/use-events";
import { useCreateSurvey } from "@/hooks/use-survey";
import { AxiosError } from "axios";
import { toast } from "sonner";
import {
  SurveyProfession,
  SurveyNotBuyingReason,
  SurveyBuyingReason,
  SurveyPackage,
  SurveyFavoriteActivity,
  SurveyMemorableImpression,
  SurveyCrewImpression,
  SURVEY_PROFESSION_LABELS,
  SURVEY_NOT_BUYING_REASON_LABELS,
  SURVEY_BUYING_REASON_LABELS,
  SURVEY_PACKAGE_LABELS,
  SURVEY_FAVORITE_ACTIVITY_LABELS,
  SURVEY_MEMORABLE_IMPRESSION_LABELS,
  SURVEY_CREW_IMPRESSION_LABELS,
} from "@/constants/survey-enums";

const PROFESSION_OPTIONS = Object.entries(SURVEY_PROFESSION_LABELS).map(([value, label]) => ({ value, label }));
const NOT_BUYING_REASON_OPTIONS = Object.entries(SURVEY_NOT_BUYING_REASON_LABELS).map(([value, label]) => ({ value, label }));
const BUYING_REASON_OPTIONS = Object.entries(SURVEY_BUYING_REASON_LABELS).map(([value, label]) => ({ value, label }));
const PACKAGE_OPTIONS = Object.entries(SURVEY_PACKAGE_LABELS).map(([value, label]) => ({ value, label }));
const FAVORITE_ACTIVITY_OPTIONS = Object.entries(SURVEY_FAVORITE_ACTIVITY_LABELS).map(([value, label]) => ({ value, label }));
const MEMORABLE_IMPRESSION_OPTIONS = Object.entries(SURVEY_MEMORABLE_IMPRESSION_LABELS).map(([value, label]) => ({ value, label }));
const CREW_IMPRESSION_OPTIONS = Object.entries(SURVEY_CREW_IMPRESSION_LABELS).map(([value, label]) => ({ value, label }));

export default function NewSurveyPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const { canCreateSurvey } = usePermissions();
  const createSurvey = useCreateSurvey();

  // Form state
  const [selectedEventId, setSelectedEventId] = useState("");
  const [profession, setProfession] = useState("");
  const [notBuyingReason, setNotBuyingReason] = useState("");
  const [buyingReason, setBuyingReason] = useState("");
  const [selectedPackage, setSelectedPackage] = useState("");
  const [favoriteActivity, setFavoriteActivity] = useState("");
  const [memorableImpression, setMemorableImpression] = useState("");
  const [crewImpression, setCrewImpression] = useState("");
  const [submitError, setSubmitError] = useState("");

  // Fetch events for SPG to select
  const { data: eventsData } = useEvents({
    limit: 50,
    enabled: canCreateSurvey,
  });

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (authStatus === "authenticated" && !canCreateSurvey) {
      router.push("/dashboard");
    }
  }, [authStatus, router, canCreateSurvey]);

  if (authStatus === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sgm-red" />
      </div>
    );
  }

  const isFormValid =
    selectedEventId &&
    profession &&
    notBuyingReason &&
    buyingReason &&
    selectedPackage &&
    favoriteActivity &&
    memorableImpression &&
    crewImpression;

  async function handleSubmit() {
    if (!isFormValid) return;
    setSubmitError("");

    try {
      await createSurvey.mutateAsync({
        eventId: selectedEventId,
        profession: profession as any,
        notBuyingReason: notBuyingReason as any,
        buyingReason: buyingReason as any,
        package: selectedPackage as any,
        favoriteActivity: favoriteActivity as any,
        memorableImpression: memorableImpression as any,
        crewImpression: crewImpression as any,
      });
      // Reset form
      setSelectedEventId("");
      setProfession("");
      setNotBuyingReason("");
      setBuyingReason("");
      setSelectedPackage("");
      setFavoriteActivity("");
      setMemorableImpression("");
      setCrewImpression("");
      router.push("/survey");
    } catch (err) {
      const message = err instanceof AxiosError
        ? (err.response?.data?.message || "Gagal menyimpan survey")
        : "Gagal menyimpan survey";
      setSubmitError(message);
    }
  }

  function RadioGroup({ options, value, onChange, name }: {
    options: readonly { value: string; label: string }[];
    value: string;
    onChange: (v: string) => void;
    name: string;
  }) {
    return (
      <div className="space-y-2">
        {options.map((opt) => (
          <label
            key={opt.value}
            className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
              value === opt.value
                ? "border-sgm-red bg-sgm-red-light/20 ring-1 ring-sgm-red"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              className="h-4 w-4 text-sgm-red accent-sgm-red"
            />
            <span className="text-sm text-gray-700">{opt.label}</span>
          </label>
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <main className="mx-auto max-w-2xl px-4 py-6 md:py-10">
        <button
          className="mb-4 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
          onClick={() => router.push("/survey")}
        >
          <ArrowLeft className="h-4 w-4" /> Back to Survey
        </button>

        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900 md:text-2xl">Form Survey</h1>
          <p className="mt-1 text-sm text-gray-500">Isi survey untuk satu customer</p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="space-y-6"
        >
          {/* Event Selection */}
          <FormSection title="Pilih Event">
            <div className="space-y-2">
              <Label>Event (Venue)</Label>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="h-11 w-full rounded-xl border bg-white px-3 text-sm outline-none focus:border-sgm-red focus:ring-2 focus:ring-sgm-red-light"
                required
              >
                <option value="">Pilih Event</option>
                {eventsData?.items.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.venueName} - {new Date(ev.eventDate).toLocaleDateString("id-ID")}
                  </option>
                ))}
              </select>
            </div>
          </FormSection>

          {/* Question 1 */}
          <FormSection title="1. Apakah Profesi Bunda?">
            <RadioGroup
              options={PROFESSION_OPTIONS}
              value={profession}
              onChange={setProfession}
              name="profession"
            />
          </FormSection>

          {/* Question 2 */}
          <FormSection title="2. Jika tidak membeli, apa alasan Bunda?">
            <RadioGroup
              options={NOT_BUYING_REASON_OPTIONS}
              value={notBuyingReason}
              onChange={setNotBuyingReason}
              name="notBuyingReason"
            />
          </FormSection>

          {/* Question 3 */}
          <FormSection title="3. Apa yang membuat Bunda membeli produk SGM Eksplor?">
            <RadioGroup
              options={BUYING_REASON_OPTIONS}
              value={buyingReason}
              onChange={setBuyingReason}
              name="buyingReason"
            />
          </FormSection>

          {/* Question 4 */}
          <FormSection title="4. Paket yang Bunda beli di acara ini">
            <RadioGroup
              options={PACKAGE_OPTIONS}
              value={selectedPackage}
              onChange={setSelectedPackage}
              name="package"
            />
          </FormSection>

          {/* Question 5 */}
          <FormSection title="5. Aktivitas apa yang paling disukai selama event?">
            <RadioGroup
              options={FAVORITE_ACTIVITY_OPTIONS}
              value={favoriteActivity}
              onChange={setFavoriteActivity}
              name="favoriteActivity"
            />
          </FormSection>

          {/* Question 6 */}
          <FormSection title="6. Kesan yang paling diingat dari Event SGM Ruang Tumbuh Lebih">
            <RadioGroup
              options={MEMORABLE_IMPRESSION_OPTIONS}
              value={memorableImpression}
              onChange={setMemorableImpression}
              name="memorableImpression"
            />
          </FormSection>

          {/* Question 7 */}
          <FormSection title="7. Bagaimana kesan Bunda terhadap Kru (Man Power) Event?">
            <RadioGroup
              options={CREW_IMPRESSION_OPTIONS}
              value={crewImpression}
              onChange={setCrewImpression}
              name="crewImpression"
            />
          </FormSection>

          {submitError && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {submitError}
            </div>
          )}

          <Button
            type="submit"
            className="h-11 w-full"
            disabled={!isFormValid || createSurvey.isPending}
          >
            {createSurvey.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Submit Survey
          </Button>
        </form>
      </main>
    </div>
  );
}
