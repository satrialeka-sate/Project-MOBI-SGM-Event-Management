import api from "@/lib/axios";
import type { ApiResponse, PaginatedData } from "./permitter";

export interface SellingItem {
  id: string;
  eventId: string;
  sellingDate: string;
  previousMilk: string;
  productId: string;
  productName: string;
  package: string;
  price: number;
  gimmick: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSellingData {
  previousMilk: string;
  productId: string;
  sellingDate?: string;
}

export const sellingApi = {
  async list(eventId: string, params: { page?: number; limit?: number } = {}) {
    const res = await api.get<ApiResponse<PaginatedData<SellingItem>>>(`/events/${eventId}/selling`, { params });
    return res.data.data;
  },

  async create(eventId: string, data: CreateSellingData) {
    const res = await api.post<ApiResponse<SellingItem>>(`/events/${eventId}/selling`, data);
    return res.data.data;
  },

  async update(eventId: string, sellingId: string, data: Partial<CreateSellingData>) {
    const res = await api.patch<ApiResponse<SellingItem>>(`/events/${eventId}/selling/${sellingId}`, data);
    return res.data.data;
  },

  async delete(eventId: string, sellingId: string) {
    const res = await api.delete<ApiResponse<void>>(`/events/${eventId}/selling/${sellingId}`);
    return res.data;
  },
};
