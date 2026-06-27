export interface VenueResponse {
  id: string;
  name: string;
  kota: string;
  alamat: string;
  picVenue: string;
  regionId: string;
  regionName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateVenueInput {
  name: string;
  kota: string;
  alamat: string;
  picVenue: string;
  regionId: string;
}

export interface UpdateVenueInput {
  name?: string;
  kota?: string;
  alamat?: string;
  picVenue?: string;
  regionId?: string;
}

export interface VenueQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  regionId?: string;
  sortBy?: "name" | "kota" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
