"use client";

import { useQuery } from "@tanstack/react-query";
import { regionApi } from "@/lib/api/region";

const REGIONS_KEY = "regions";

export function useRegions() {
  return useQuery({
    queryKey: [REGIONS_KEY],
    queryFn: () => regionApi.list(),
    staleTime: 5 * 60 * 1000,
  });
}
