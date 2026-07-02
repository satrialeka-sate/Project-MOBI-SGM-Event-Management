export type EventStatus = "UPCOMING" | "ONGOING" | "COMPLETED";

export interface EventResponse {
  id: string;
  permitterId: string;
  regionId: string;
  regionName: string;
  venueName: string;
  venueAddress: string;
  eventDate: string;
  status: EventStatus;
  permitterName: string;
  permitterUser?: {
    id: string;
    name: string;
  };
  spg?: {
    id: string;
    name: string;
  } | null;
  schools: Array<{
    id: string;
    name: string;
    schoolAddress: string;
    totalStudents: number;
    picName: string;
    picPhone: string;
    order: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface EventQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  regionId?: string;
  date?: string;
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
