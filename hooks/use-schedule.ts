"use client";

import { useQuery } from "@tanstack/react-query";
import { scheduleApi, type ScheduleQueryParams } from "@/lib/api/schedule";

const SCHEDULE_KEY = "schedule";

export function useSchedule(params: ScheduleQueryParams & { enabled?: boolean }) {
  const { enabled, ...queryParams } = params;
  return useQuery({
    queryKey: [SCHEDULE_KEY, queryParams],
    queryFn: () => scheduleApi.getSchedule(queryParams),
    enabled: enabled !== false && !!params.month && !!params.year,
  });
}
