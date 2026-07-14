import type { UserRole, UserStatus } from "@/constants/prisma-enums";

/** User response from the API */
export interface UserResponse {
  id: string;
  name: string;
  username: string | null;
  email: string;
  phone: string | null;
  role: UserRole;
  level: string;
  scope: string;
  businessRole: string;
  regionId: string;
  status: string;
  isActive: boolean;
  image: string | null;
  createdAt: string;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectedBy: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
}

/** Input for creating a user via admin panel */
export interface CreateUserInput {
  name: string;
  username: string;
  email: string;
  password: string;
  role: string;
  level: string;
  scope: string;
  businessRole: string;
  regionId: string;
  isActive?: boolean;
}

/** Input for updating a user via admin panel */
export interface UpdateUserInput {
  name?: string;
  username?: string;
  email?: string;
  password?: string;
  role?: string;
  level?: string;
  scope?: string;
  businessRole?: string;
  regionId?: string;
  isActive?: boolean;
}

/** Input for self-registration */
export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: string;
  regionId: string;
}

/** Input for approving/rejecting a user */
export interface ApproveUserInput {
  status: UserStatus;
  rejectionReason?: string;
}

/** Paginated response wrapper */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
