"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { eventApi, type EventQueryParams } from "@/lib/api/event";
import { toast } from "sonner";

const EVENTS_KEY = "events";

export function useEvents(params: EventQueryParams & { enabled?: boolean } = {}) {
  const { enabled, ...queryParams } = params;
  return useQuery({
    queryKey: [EVENTS_KEY, queryParams],
    queryFn: () => eventApi.list(queryParams),
    enabled: enabled !== false,
  });
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: [EVENTS_KEY, id],
    queryFn: () => eventApi.getById(id),
    enabled: !!id,
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventId: string) => eventApi.delete(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EVENTS_KEY] });
      toast.success("Event deleted successfully");
    },
    onError: (error: unknown) => {
      const message = error instanceof AxiosError
        ? (error.response?.data?.message || "Failed to delete event")
        : "Failed to delete event";
      toast.error(message);
    },
  });
}
