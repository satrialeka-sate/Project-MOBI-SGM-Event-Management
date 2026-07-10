import api from "@/lib/axios";
import type { UserRole } from "@/constants/prisma-enums";
import type { UserResponse } from "@/types/user";

/** Response type from the API */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
}

export interface UserItem {
  id: string;
  name: string;
  username?: string | null;
  email: string;
  phone?: string | null;
  role: UserRole;
  level: string;
  scope: string;
  regionId: string;
  status: string;
  isActive: boolean;
  image?: string | null;
  createdAt?: string;
  /** ID of the admin who approved this user */
  approvedBy?: string | null;
  /** Timestamp when the user was approved */
  approvedAt?: string | null;
  /** ID of the admin who rejected this user */
  rejectedBy?: string | null;
  /** Timestamp when the user was rejected */
  rejectedAt?: string | null;
  /** Reason for rejection */
  rejectionReason?: string | null;
}

export interface CreateUserData {
  name: string;
  username: string;
  email: string;
  password: string;
  role: string;
  level: string;
  scope: string;
  regionId: string;
  isActive?: boolean;
}

export interface UpdateUserData {
  name?: string;
  username?: string;
  email?: string;
  password?: string;
  role?: string;
  level?: string;
  scope?: string;
  regionId?: string;
  isActive?: boolean;
}

export const userApi = {
  async list(params?: { role?: string }) {
    const res = await api.get<ApiResponse<UserItem[]>>("/users", { params });
    return res.data.data;
  },

  async listByRole(role: string) {
    return this.list({ role });
  },

  async getById(id: string) {
    const res = await api.get<ApiResponse<UserItem>>(`/users/${id}`);
    return res.data.data;
  },

  async create(data: CreateUserData) {
    const res = await api.post<ApiResponse<UserItem>>("/users", data);
    return res.data.data;
  },

  async update(id: string, data: UpdateUserData) {
    const res = await api.patch<ApiResponse<UserItem>>(`/users/${id}`, data);
    return res.data.data;
  },

  async delete(id: string) {
    const res = await api.delete<ApiResponse<null>>(`/users/${id}`);
    return res.data;
  },
};
