export type PreviousMilk = "SGM" | "SUSU_BUBUK" | "NON_SUSU_BUBUK" | "NEW_TO_GUM" | "OTHERS";

export interface SellingResponse {
  id: string;
  eventId: string;
  sellingDate: string;
  previousMilk: PreviousMilk;
  productId: string;
  productName: string;
  package: string;
  price: number;
  gimmick: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSellingInput {
  previousMilk: PreviousMilk;
  productId: string;
  sellingDate?: string;
}

export interface UpdateSellingInput {
  previousMilk?: PreviousMilk;
  productId?: string;
  sellingDate?: string;
}

export interface SellingQueryParams {
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
