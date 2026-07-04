export interface ContactResponse {
  id: string;
  eventId: string;
  contactDate: string;
  totalContact: number;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContactInput {
  totalContact: number;
  contactDate?: string;
}

export interface UpdateContactInput {
  totalContact?: number;
  contactDate?: string;
}

export interface ContactQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
