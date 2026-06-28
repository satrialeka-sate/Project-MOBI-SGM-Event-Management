"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { permitterApi, type PermitterQueryParams } from "@/lib/api/permitter";
import { toast } from "sonner";

const PERMITTERS_KEY = "permitters";

export function usePermitters(params: PermitterQueryParams = {}) {
  return useQuery({
    queryKey: [PERMITTERS_KEY, params],
    queryFn: () => permitterApi.list(params),
  });
}

export function usePermitter(id: string) {
  return useQuery({
    queryKey: [PERMITTERS_KEY, id],
    queryFn: () => permitterApi.getById(id),
    enabled: !!id,
  });
}

export function useCreatePermitter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: permitterApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PERMITTERS_KEY] });
      toast.success("Permitter created successfully");
    },
    onError: (error: unknown) => {
      const message = error instanceof AxiosError
        ? (error.response?.data?.message || "Failed to create permitter")
        : "Failed to create permitter";
      toast.error(message);
    },
  });
}

export function useUpdatePermitter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof permitterApi.update>[1] }) =>
      permitterApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PERMITTERS_KEY] });
      toast.success("Permitter updated successfully");
    },
    onError: (error: unknown) => {
      const message = error instanceof AxiosError
        ? (error.response?.data?.message || "Failed to update permitter")
        : "Failed to update permitter";
      toast.error(message);
    },
  });
}

export function useDeletePermitter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: permitterApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PERMITTERS_KEY] });
      toast.success("Permitter deleted successfully");
    },
    onError: (error: unknown) => {
      const message = error instanceof AxiosError
        ? (error.response?.data?.message || "Failed to delete permitter")
        : "Failed to delete permitter";
      toast.error(message);
    },
  });
}
