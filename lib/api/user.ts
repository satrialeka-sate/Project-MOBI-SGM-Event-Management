import api from "@/lib/axios";
import type { ApiResponse } from "./permitter";

export interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  regionId: string;
}

export const userApi = {
  async listByRole(role: string) {
    const res = await api.get<ApiResponse<UserItem[]>>("/users", { params: { role } });
    return res.data.data;
  },
};
