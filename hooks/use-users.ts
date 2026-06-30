"use client";

import { useQuery } from "@tanstack/react-query";
import { UserRole } from "@prisma/client";
import { userApi } from "@/lib/api/user";

const USERS_KEY = "users";

export function useSpgUsers() {
  return useQuery({
    queryKey: [USERS_KEY, UserRole.SPG],
    queryFn: () => userApi.listByRole(UserRole.SPG),
    staleTime: 5 * 60 * 1000,
  });
}
