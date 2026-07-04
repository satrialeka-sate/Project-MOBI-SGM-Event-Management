export interface SchoolResponse {
  id: string;
  name: string;
  schoolAddress: string;
  totalStudents: number;
  picName: string;
  picPhone: string;
  order: number;
}

export interface PermitterResponse {
  id: string;
  permitterId: string;
  permitterName: string;
  regionId: string;
  regionName: string;
  cycle: string;
  venueName: string;
  venueAddress: string;
  venuePIC: string;
  venuePICPhone: string;
  eventDate: Date;
  schools: SchoolResponse[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSchoolInput {
  name: string;
  schoolAddress: string;
  totalStudents: number;
  picName: string;
  picPhone: string;
}

export interface CreatePermitterInput {
  permitterId: string;
  regionId: string;
  cycle: string;
  venueName: string;
  venueAddress: string;
  venuePIC: string;
  venuePICPhone: string;
  eventDate: Date;
  status?: string;
  schools: CreateSchoolInput[];
}

export interface UpdateSchoolInput {
  name?: string;
  schoolAddress?: string;
  totalStudents?: number;
  picName?: string;
  picPhone?: string;
}

export interface UpdatePermitterInput {
  permitterId?: string;
  regionId?: string;
  cycle?: string;
  venueName?: string;
  venueAddress?: string;
  venuePIC?: string;
  venuePICPhone?: string;
  eventDate?: Date;
  schools?: CreateSchoolInput[];
}

export interface PermitterQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  regionId?: string;
  userId?: string;
  date?: Date;
  sortBy?: "eventDate" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
