import api from "@/lib/axios";

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PermitterItem {
  id: string;
  permitterId: string;
  permitterName: string;
  regionId: string;
  regionName: string;
  cycle: string;
  venueName: string;
  venueAddress: string;
  venuePIC: string;
  venuePICPhone: string;
  eventDate: string;
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

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreatePermitterData {
  permitterId: string;
  regionId: string;
  venueName: string;
  venueAddress: string;
  venuePIC: string;
  venuePICPhone: string;
  eventDate: string;
  schools: Array<{
    name: string;
    schoolAddress: string;
    totalStudents: number;
    picName: string;
    picPhone: string;
  }>;
}

export interface UpdatePermitterData {
  permitterId?: string;
  regionId?: string;
  venueName?: string;
  venueAddress?: string;
  venuePIC?: string;
  venuePICPhone?: string;
  eventDate?: string;
  schools?: Array<{
    name: string;
    schoolAddress: string;
    totalStudents: number;
    picName: string;
    picPhone: string;
  }>;
}

export interface PermitterQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  regionId?: string;
  userId?: string;
  date?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export const permitterApi = {
  async list(params: PermitterQueryParams = {}) {
    const res = await api.get<ApiResponse<PaginatedData<PermitterItem>>>("/permitters", { params });
    return res.data.data;
  },

  async getById(id: string) {
    const res = await api.get<ApiResponse<PermitterItem>>(`/permitters/${id}`);
    return res.data.data;
  },

  async create(data: CreatePermitterData) {
    const res = await api.post<ApiResponse<PermitterItem>>("/permitters", data);
    return res.data.data;
  },

  async update(id: string, data: UpdatePermitterData) {
    const res = await api.patch<ApiResponse<PermitterItem>>(`/permitters/${id}`, data);
    return res.data.data;
  },

  async delete(id: string) {
    const res = await api.delete<ApiResponse<null>>(`/permitters/${id}`);
    return res.data;
  },
};
