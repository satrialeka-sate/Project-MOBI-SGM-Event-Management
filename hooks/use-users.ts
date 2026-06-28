"use client";

import { useQuery } from "@tanstack/react-query";
import { userApi } from "@/lib/api/user";

const USERS_KEY = "users";

export function useSpgUsers() {
  return useQuery({
    queryKey: [USERS_KEY, "SPG"],
    queryFn: () => userApi.listByRole("SPG"),
    staleTime: 5 * 60 * 1000,
  });
}
