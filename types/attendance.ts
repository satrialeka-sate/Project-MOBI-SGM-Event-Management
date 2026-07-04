export interface AttendanceResponse {
  id: string;
  eventId: string;
  userId: string;
  userName?: string;
  photo: string;
  attendanceAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAttendanceInput {
  photo: string;
}

export interface UpdateAttendanceInput {
  photo?: string;
}

export interface AttendanceQueryParams {
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
