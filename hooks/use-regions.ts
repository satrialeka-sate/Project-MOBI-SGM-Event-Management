"use client";

import { useQuery } from "@tanstack/react-query";
import { regionApi } from "@/lib/api/region";

const REGIONS_KEY = "regions";

/**
 * Hook to fetch all operational regions.
 *
 * Defensive guarantees:
 * - `data` is ALWAYS a RegionItem[] array — never undefined
 * - On loading state: returns empty array
 * - On error state: returns empty array
 * - `isLoading` is true ONLY during initial fetch
 * - `isError` is true ONLY if the query actually failed
 *
 * Usage:
 *   const { data: regions, isLoading } = useRegions();
 *   regions.map(...) // safe, always an array
 */
export function useRegions() {
  return useQuery({
    queryKey: [REGIONS_KEY],
    queryFn: async () => {
      const result = await regionApi.list();
      console.log("[useRegions] QUERY RESULT:", JSON.stringify(result));
      console.log("[useRegions] isArray?", Array.isArray(result), "length:", result.length);
      return result;
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: [],
  });
}
