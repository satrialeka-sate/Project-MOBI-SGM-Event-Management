"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userApi } from "@/lib/api/user";
import { toast } from "sonner";
import { AxiosError } from "axios";

const USERS_KEY = "users";

export function useUsers(params?: { role?: string }) {
  return useQuery({
    queryKey: [USERS_KEY, params],
    queryFn: () => userApi.list(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: [USERS_KEY, id],
    queryFn: () => userApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_KEY] });
      toast.success("User created successfully");
    },
    onError: (error: unknown) => {
      const message = error instanceof AxiosError
        ? (error.response?.data?.message || "Failed to create user")
        : "Failed to create user";
      toast.error(message);
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof userApi.update>[1] }) =>
      userApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_KEY] });
      toast.success("User updated successfully");
    },
    onError: (error: unknown) => {
      const message = error instanceof AxiosError
        ? (error.response?.data?.message || "Failed to update user")
        : "Failed to update user";
      toast.error(message);
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_KEY] });
      toast.success("User deleted successfully");
    },
    onError: (error: unknown) => {
      const message = error instanceof AxiosError
        ? (error.response?.data?.message || "Failed to delete user")
        : "Failed to delete user";
      toast.error(message);
    },
  });
}
