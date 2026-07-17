"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { surveyApi } from "@/lib/api/survey";
import type { CreateSurveyInput, SurveyQueryParams } from "@/types/survey";
import type { SurveyAiAnalysis } from "@/types/survey-ai";
import { toast } from "sonner";
import { usePermissions } from "./use-permissions";

const SURVEYS_KEY = "surveys";

export function useSurveys(params: SurveyQueryParams & { enabled?: boolean } = {}) {
  const { enabled, ...queryParams } = params;
  const { canReadSurvey } = usePermissions();

  return useQuery({
    queryKey: [SURVEYS_KEY, queryParams],
    queryFn: () => surveyApi.list(queryParams),
    enabled: enabled !== false && !!canReadSurvey,
  });
}

export function useSurvey(id: string) {
  const { canReadSurvey } = usePermissions();

  return useQuery({
    queryKey: [SURVEYS_KEY, id],
    queryFn: () => surveyApi.getById(id),
    enabled: !!id && !!canReadSurvey,
  });
}

export function useCreateSurvey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSurveyInput) => surveyApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SURVEYS_KEY] });
      toast.success("Survey berhasil disimpan");
    },
    onError: (error: unknown) => {
      const message = error instanceof AxiosError
        ? (error.response?.data?.message || "Gagal menyimpan survey")
        : "Gagal menyimpan survey";
      toast.error(message);
    },
  });
}

export function useSurveyReport(params: { eventId?: string; regionId?: string; startDate?: string; endDate?: string; enabled?: boolean } = {}) {
  const { enabled, ...queryParams } = params;
  const { canReadSurvey } = usePermissions();

  return useQuery({
    queryKey: [SURVEYS_KEY, "report", queryParams],
    queryFn: () => surveyApi.getReport(queryParams),
    enabled: enabled !== false && !!canReadSurvey,
  });
}

// ─── AI Analysis Hooks ───────────────────────────────────────────────────

/** Query key for AI analysis */
const AI_KEY = "survey-ai";

/**
 * Hook to fetch cached AI analysis for an event.
 * Returns null when no cached analysis exists.
 */
export function useEventAiAnalysis(
  eventId: string | undefined,
  options: { enabled?: boolean } = {}
) {
  const { canReadSurvey } = usePermissions();

  return useQuery<SurveyAiAnalysis | null>({
    queryKey: [AI_KEY, "event", eventId],
    queryFn: () => surveyApi.getEventAiAnalysis(eventId!),
    enabled: options.enabled !== false && !!eventId && !!canReadSurvey,
  });
}

/**
 * Hook to fetch cached AI analysis for a region.
 */
export function useRegionAiAnalysis(
  regionId: string | undefined,
  options: { enabled?: boolean } = {}
) {
  const { canReadSurveyRegion } = usePermissions();

  return useQuery<SurveyAiAnalysis | null>({
    queryKey: [AI_KEY, "region", regionId],
    queryFn: () => surveyApi.getRegionAiAnalysis(regionId!),
    enabled: options.enabled !== false && !!regionId && !!canReadSurveyRegion,
  });
}

/**
 * Hook to fetch cached AI analysis for all regions.
 */
export function useAllAiAnalysis(options: { enabled?: boolean } = {}) {
  const { canReadSurveyAll } = usePermissions();

  return useQuery<SurveyAiAnalysis | null>({
    queryKey: [AI_KEY, "all"],
    queryFn: () => surveyApi.getAllAiAnalysis(),
    enabled: options.enabled !== false && !!canReadSurveyAll,
  });
}

/**
 * Hook to generate (or regenerate) AI analysis for an event.
 */
export function useGenerateEventAiAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventId: string) => surveyApi.generateEventAiAnalysis(eventId),
    onSuccess: (_, eventId) => {
      queryClient.invalidateQueries({ queryKey: [AI_KEY, "event", eventId] });
      toast.success("Analisis AI berhasil dibuat");
    },
    onError: (error: unknown) => {
      const message = error instanceof AxiosError
        ? (error.response?.data?.message || "Gagal membuat analisis AI")
        : "Gagal membuat analisis AI";
      toast.error(message);
    },
  });
}

/**
 * Hook to generate (or regenerate) AI analysis for a region.
 */
export function useGenerateRegionAiAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (regionId: string) => surveyApi.generateRegionAiAnalysis(regionId),
    onSuccess: (_, regionId) => {
      queryClient.invalidateQueries({ queryKey: [AI_KEY, "region", regionId] });
      toast.success("Analisis AI berhasil dibuat");
    },
    onError: (error: unknown) => {
      const message = error instanceof AxiosError
        ? (error.response?.data?.message || "Gagal membuat analisis AI")
        : "Gagal membuat analisis AI";
      toast.error(message);
    },
  });
}

/**
 * Hook to generate (or regenerate) AI analysis for all regions.
 */
export function useGenerateAllAiAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => surveyApi.generateAllAiAnalysis(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [AI_KEY, "all"] });
      toast.success("Analisis AI berhasil dibuat");
    },
    onError: (error: unknown) => {
      const message = error instanceof AxiosError
        ? (error.response?.data?.message || "Gagal membuat analisis AI")
        : "Gagal membuat analisis AI";
      toast.error(message);
    },
  });
}
