"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { attendanceApi, type AttendanceItem } from "@/lib/api/attendance";
import { toast } from "sonner";

const ATTENDANCE_KEY = "attendance";

export function useAttendanceList(eventId: string, enabled?: boolean) {
  return useQuery({
    queryKey: [ATTENDANCE_KEY, eventId],
    queryFn: () => attendanceApi.list(eventId),
    enabled: !!eventId && enabled !== false,
  });
}

export function useMyAttendance(eventId: string) {
  return useQuery({
    queryKey: [ATTENDANCE_KEY, "my", eventId],
    queryFn: () => attendanceApi.getMy(eventId),
    enabled: !!eventId,
  });
}

export function useCreateAttendance(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { photo: string }) => attendanceApi.create(eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ATTENDANCE_KEY, eventId] });
      toast.success("Attendance recorded successfully");
    },
    onError: (error: unknown) => {
      const message = error instanceof AxiosError
        ? (error.response?.data?.message || "Failed to record attendance")
        : "Failed to record attendance";
      toast.error(message);
    },
  });
}

export function useUpdateAttendance(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { photo?: string } }) =>
      attendanceApi.update(eventId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ATTENDANCE_KEY, eventId] });
      toast.success("Attendance updated successfully");
    },
    onError: (error: unknown) => {
      const message = error instanceof AxiosError
        ? (error.response?.data?.message || "Failed to update attendance")
        : "Failed to update attendance";
      toast.error(message);
    },
  });
}

export function useDeleteAttendance(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => attendanceApi.delete(eventId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ATTENDANCE_KEY, eventId] });
      toast.success("Attendance deleted successfully");
    },
    onError: (error: unknown) => {
      const message = error instanceof AxiosError
        ? (error.response?.data?.message || "Failed to delete attendance")
        : "Failed to delete attendance";
      toast.error(message);
    },
  });
}
