"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { sellingApi, type CreateSellingData, type SellingItem } from "@/lib/api/selling";
import { toast } from "sonner";

const SELLINGS_KEY = "sellings";

export function useSellingList(eventId: string, enabled?: boolean) {
  return useQuery({
    queryKey: [SELLINGS_KEY, eventId],
    queryFn: () => sellingApi.list(eventId),
    enabled: !!eventId && enabled !== false,
  });
}

export function useCreateSelling(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSellingData) => sellingApi.create(eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SELLINGS_KEY, eventId] });
      toast.success("Selling data recorded successfully");
    },
    onError: (error: unknown) => {
      const message = error instanceof AxiosError
        ? (error.response?.data?.message || "Failed to record selling")
        : "Failed to record selling";
      toast.error(message);
    },
  });
}

export function useUpdateSelling(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateSellingData> }) =>
      sellingApi.update(eventId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SELLINGS_KEY, eventId] });
      toast.success("Selling data updated successfully");
    },
    onError: (error: unknown) => {
      const message = error instanceof AxiosError
        ? (error.response?.data?.message || "Failed to update selling")
        : "Failed to update selling";
      toast.error(message);
    },
  });
}

export function useDeleteSelling(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => sellingApi.delete(eventId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SELLINGS_KEY, eventId] });
      toast.success("Selling deleted successfully");
    },
    onError: (error: unknown) => {
      const message = error instanceof AxiosError
        ? (error.response?.data?.message || "Failed to delete selling")
        : "Failed to delete selling";
      toast.error(message);
    },
  });
}
