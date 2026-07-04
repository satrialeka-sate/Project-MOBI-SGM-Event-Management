"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { contactApi, type CreateContactData, type ContactItem } from "@/lib/api/contact";
import { toast } from "sonner";

const CONTACTS_KEY = "contacts";

export function useContactList(eventId: string) {
  return useQuery({
    queryKey: [CONTACTS_KEY, eventId],
    queryFn: () => contactApi.list(eventId),
    enabled: !!eventId,
  });
}

export function useCreateContact(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateContactData) => contactApi.create(eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CONTACTS_KEY, eventId] });
      toast.success("Contact data recorded successfully");
    },
    onError: (error: unknown) => {
      const message = error instanceof AxiosError
        ? (error.response?.data?.message || "Failed to record contact")
        : "Failed to record contact";
      toast.error(message);
    },
  });
}

export function useUpdateContact(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateContactData> }) =>
      contactApi.update(eventId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CONTACTS_KEY, eventId] });
      toast.success("Contact data updated successfully");
    },
    onError: (error: unknown) => {
      const message = error instanceof AxiosError
        ? (error.response?.data?.message || "Failed to update contact")
        : "Failed to update contact";
      toast.error(message);
    },
  });
}

export function useDeleteContact(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => contactApi.delete(eventId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CONTACTS_KEY, eventId] });
      toast.success("Contact deleted successfully");
    },
    onError: (error: unknown) => {
      const message = error instanceof AxiosError
        ? (error.response?.data?.message || "Failed to delete contact")
        : "Failed to delete contact";
      toast.error(message);
    },
  });
}
