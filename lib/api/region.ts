import api from "@/lib/axios";
import type { ApiResponse } from "./permitter";

export interface RegionItem {
  id: string;
  name: string;
}

const DEFAULT_REGIONS: RegionItem[] = [];

export const regionApi = {
  /**
   * Fetch all operational regions.
   * ALWAYS returns a RegionItem[] array — never undefined, never null.
   * On any error (network, API failure, unexpected response), returns empty array.
   */
  async list(): Promise<RegionItem[]> {
    try {
      const res = await api.get<ApiResponse<RegionItem[]>>("/regions");
      console.log("[regionApi.list] RAW RESPONSE:", JSON.stringify(res.data, null, 2));
      console.log("[regionApi.list] STATUS:", res.status);
      const data = res.data?.data;
      console.log("[regionApi.list] EXTRACTED data:", JSON.stringify(data));
      console.log("[regionApi.list] isArray?", Array.isArray(data));
      // Normalize: if API returns null, undefined, or non-array, return empty array
      if (!Array.isArray(data)) {
        console.warn("[regionApi.list] data is not an array, returning []");
        return DEFAULT_REGIONS;
      }
      console.log("[regionApi.list] RETURNING array of length:", data.length);
      return data;
    } catch (err) {
      console.error("[regionApi.list] CATCH error:", err);
      // Network error, 4xx/5xx, or unexpected response structure
      console.warn("[regionApi.list] returning [] due to error");
      return DEFAULT_REGIONS;
    }
  },
};
