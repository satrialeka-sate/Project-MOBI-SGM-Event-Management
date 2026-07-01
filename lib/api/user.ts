import api from "@/lib/axios";
import type { ApiResponse } from "./permitter";

import type { UserRole } from "@/constants/prisma-enums";

export interface UserItem {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  level: string;
  scope: string;
  regionId: string;
}

export const userApi = {
  async listByRole(role: string) {
    const res = await api.get<ApiResponse<UserItem[]>>("/users", { params: { role } });
    return res.data.data;
  },
};
