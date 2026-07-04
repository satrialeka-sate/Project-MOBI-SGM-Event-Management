export interface MasterProductResponse {
  id: string;
  productName: string;
  price: number;
  package: string;
  gimmick: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMasterProductInput {
  productName: string;
  price: number;
  package: string;
  gimmick: string;
}

export interface MasterProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
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
