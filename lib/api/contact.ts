import api from "@/lib/axios";
import type { ApiResponse, PaginatedData } from "./permitter";

export interface ContactItem {
  id: string;
  eventId: string;
  contactDate: string;
  totalContact: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContactData {
  totalContact: number;
  contactDate?: string;
}

export const contactApi = {
  async list(eventId: string, params: { page?: number; limit?: number } = {}) {
    const res = await api.get<ApiResponse<PaginatedData<ContactItem>>>(`/events/${eventId}/contact`, { params });
    return res.data.data;
  },

  async create(eventId: string, data: CreateContactData) {
    const res = await api.post<ApiResponse<ContactItem>>(`/events/${eventId}/contact`, data);
    return res.data.data;
  },

  async update(eventId: string, contactId: string, data: Partial<CreateContactData>) {
    const res = await api.patch<ApiResponse<ContactItem>>(`/events/${eventId}/contact/${contactId}`, data);
    return res.data.data;
  },

  async delete(eventId: string, contactId: string) {
    const res = await api.delete<ApiResponse<void>>(`/events/${eventId}/contact/${contactId}`);
    return res.data;
  },
};
