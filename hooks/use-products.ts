"use client";

import { useQuery } from "@tanstack/react-query";
import { productApi } from "@/lib/api/product";

const PRODUCTS_KEY = "products";

export function useProductList(enabled: boolean) {
  return useQuery({
    queryKey: [PRODUCTS_KEY, "list"],
    queryFn: () => productApi.list({ limit: 100 }),
    enabled,
    staleTime: 30_000,
    select: (data) => data.items,
  });
}

export function useProductSearch(search: string) {
  return useQuery({
    queryKey: [PRODUCTS_KEY, "search", search],
    queryFn: () => productApi.search(search),
    enabled: search.length > 0,
    staleTime: 30_000,
  });
}
