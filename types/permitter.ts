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
  spgId: string;
  spgName: string;
  venueId: string;
  venueName: string;
  regionId: string;
  regionName: string;
  eventDate: Date;
  status: string;
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
  spgId: string;
  venueId: string;
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
  spgId?: string;
  venueId?: string;
  eventDate?: Date;
  status?: string;
  schools?: CreateSchoolInput[];
}

export interface PermitterQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  venueId?: string;
  userId?: string;
  date?: Date;
  status?: string;
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
