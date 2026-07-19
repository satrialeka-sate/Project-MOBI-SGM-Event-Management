"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { surveyApi } from "@/lib/api/survey";
import type { CreateSurveyInput, SurveyQueryParams } from "@/types/survey";
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

export function useDeleteSurvey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => surveyApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SURVEYS_KEY] });
      toast.success("Survey berhasil dihapus");
    },
    onError: (error: unknown) => {
      // Refresh list to remove stale data (e.g. if survey was already deleted)
      queryClient.invalidateQueries({ queryKey: [SURVEYS_KEY] });

      const message = error instanceof AxiosError
        ? (error.response?.data?.message || "Gagal menghapus survey")
        : "Gagal menghapus survey";
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
