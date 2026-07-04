import api from "@/lib/axios";
import type { ApiResponse } from "./permitter";
import type { ScheduleResponse } from "@/types/schedule";

export interface ScheduleQueryParams {
  month: number;
  year: number;
  regionId?: string;
  cycle?: string;
}

export const scheduleApi = {
  async getSchedule(params: ScheduleQueryParams) {
    const res = await api.get<ApiResponse<ScheduleResponse>>("/schedules", { params });
    return res.data.data;
  },
};
