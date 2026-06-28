import api from "@/lib/axios";
import type { ApiResponse } from "./permitter";

export interface RegionItem {
  id: string;
  name: string;
}

export const regionApi = {
  async list() {
    const res = await api.get<ApiResponse<RegionItem[]>>("/regions");
    return res.data.data;
  },
};
