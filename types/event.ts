export type EventStatus = "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED";

export interface EventResponse {
  id: string;
  permitterId: string;
  permitterName: string;
  spgId: string;
  spgName: string;
  regionId: string;
  regionName: string;
  cycle: string;
  venueName: string;
  venueCity: string;
  venueAddress: string;
  venuePIC: string;
  eventDate: Date;
  startTime: Date | null;
  endTime: Date | null;
  actualStartTime: Date | null;
  actualEndTime: Date | null;
  startedById: string | null;
  completedById: string | null;
  notes: string | null;
  photoUrl: string | null;
  status: EventStatus;
  schools: Array<{
    id: string;
    name: string;
    schoolAddress: string;
    totalStudents: number;
    picName: string;
    picPhone: string;
    order: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEventInput {
  permitterId: string;
}

export interface UpdateEventInput {
  startTime?: string | null;
  endTime?: string | null;
  actualStartTime?: string | null;
  actualEndTime?: string | null;
  startedById?: string | null;
  completedById?: string | null;
  notes?: string | null;
  photoUrl?: string | null;
  status?: EventStatus;
}

export interface EventQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  regionId?: string;
  permitterId?: string;
  spgId?: string;
  sortBy?: "eventDate" | "createdAt" | "updatedAt" | "status";
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
