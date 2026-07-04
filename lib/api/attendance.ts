import api from "@/lib/axios";
import type { ApiResponse, PaginatedData } from "./permitter";

export interface AttendanceItem {
  id: string;
  eventId: string;
  userId: string;
  userName?: string;
  photo: string;
  attendanceAt: string;
  createdAt: string;
  updatedAt: string;
}

export const attendanceApi = {
  async list(eventId: string, params: { page?: number; limit?: number } = {}) {
    const res = await api.get<ApiResponse<PaginatedData<AttendanceItem>>>(`/events/${eventId}/attendance`, { params });
    return res.data.data;
  },

  async getMy(eventId: string) {
    const res = await api.get<ApiResponse<AttendanceItem | null>>(`/events/${eventId}/attendance/my`);
    return res.data.data;
  },

  async create(eventId: string, data: { photo: string }) {
    const res = await api.post<ApiResponse<AttendanceItem>>(`/events/${eventId}/attendance`, data);
    return res.data.data;
  },

  async update(eventId: string, attendanceId: string, data: { photo?: string }) {
    const res = await api.patch<ApiResponse<AttendanceItem>>(`/events/${eventId}/attendance/${attendanceId}`, data);
    return res.data.data;
  },

  async delete(eventId: string, attendanceId: string) {
    const res = await api.delete<ApiResponse<void>>(`/events/${eventId}/attendance/${attendanceId}`);
    return res.data;
  },
};
