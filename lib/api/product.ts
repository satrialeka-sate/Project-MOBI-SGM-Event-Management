import api from "@/lib/axios";
import type { ApiResponse, PaginatedData } from "./permitter";

export interface ProductItem {
  id: string;
  productName: string;
  price: number;
  package: string;
  gimmick: string;
  createdAt: string;
  updatedAt: string;
}

export const productApi = {
  async list(params: { page?: number; limit?: number } = {}) {
    const res = await api.get<ApiResponse<PaginatedData<ProductItem>>>("/products", { params });
    return res.data.data;
  },

  async search(query: string) {
    const res = await api.get<ApiResponse<ProductItem[]>>("/products", { params: { search: query } });
    return res.data.data;
  },
};
