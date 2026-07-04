import api from "@/lib/axios";
import type { ApiResponse, PaginatedData } from "./permitter";

export interface EventItem {
  id: string;
  permitterId: string;
  regionId: string;
  regionName: string;
  venueName: string;
  venueAddress: string;
  eventDate: string;
  status: "UPCOMING" | "ONGOING" | "COMPLETED";
  permitterName: string;
  permitterUser?: { id: string; name: string };
  spg?: { id: string; name: string } | null;
  schools: Array<{
    id: string;
    name: string;
    schoolAddress: string;
    totalStudents: number;
    picName: string;
    picPhone: string;
    order: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface EventQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  regionId?: string;
  date?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export const eventApi = {
  async list(params: EventQueryParams = {}) {
    const res = await api.get<ApiResponse<PaginatedData<EventItem>>>("/events", { params });
    return res.data.data;
  },

  async getById(id: string) {
    const res = await api.get<ApiResponse<EventItem>>(`/events/${id}`);
    return res.data.data;
  },

  async delete(id: string) {
    const res = await api.delete<ApiResponse<null>>(`/events/${id}`);
    return res.data;
  },
};
