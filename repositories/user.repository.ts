import { prisma } from "@/lib/prisma";
import type { Prisma, UserStatus } from "../generated/prisma/client";

/** Fields we always select when querying users (excluding password) */
const userSelect = {
  id: true,
  name: true,
  username: true,
  email: true,
  phone: true,
  role: true,
  level: true,
  scope: true,
  businessRole: true,
  regionId: true,
  status: true,
  isActive: true,
  approvedBy: true,
  approvedAt: true,
  rejectedBy: true,
  rejectedAt: true,
  rejectionReason: true,
  image: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

type UserSelectType = Prisma.UserGetPayload<{ select: typeof userSelect }>;

export const userRepository = {
  /**
   * Find all users with optional filters.
   */
  async findAll(where: Prisma.UserWhereInput = {}): Promise<UserSelectType[]> {
    return prisma.user.findMany({
      where,
      orderBy: { name: "asc" },
      select: userSelect,
    });
  },

  /**
   * Find a single user by ID.
   */
  async findById(id: string): Promise<UserSelectType | null> {
    return prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });
  },

  /**
   * Find a single user by email.
   */
  async findByEmail(email: string): Promise<UserSelectType | null> {
    return prisma.user.findUnique({
      where: { email },
      select: userSelect,
    });
  },

  /**
   * Find a single user by username.
   */
  async findByUsername(username: string): Promise<UserSelectType | null> {
    return prisma.user.findUnique({
      where: { username },
      select: userSelect,
    });
  },

  /**
   * Find a user by email for auth purposes (includes password field).
   */
  async findByEmailWithPassword(email: string) {
    return prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
        level: true,
        scope: true,
        regionId: true,
        status: true,
        isActive: true,
        image: true,
      },
    });
  },

  /**
   * Create a new user.
   */
  async create(data: Prisma.UserUncheckedCreateInput): Promise<UserSelectType> {
    return prisma.user.create({
      data,
      select: userSelect,
    });
  },

  /**
   * Update a user by ID.
   */
  async update(
    id: string,
    data: Prisma.UserUpdateInput
  ): Promise<UserSelectType> {
    return prisma.user.update({
      where: { id },
      data,
      select: userSelect,
    });
  },

  /**
   * Update user status with audit trail.
   */
  async updateStatus(
    id: string,
    data: {
      status: UserStatus;
      isActive: boolean;
      approvedBy?: string | null;
      approvedAt?: Date | null;
      rejectedBy?: string | null;
      rejectedAt?: Date | null;
      rejectionReason?: string | null;
    }
  ): Promise<UserSelectType> {
    return prisma.user.update({
      where: { id },
      data,
      select: userSelect,
    });
  },

  /**
   * Delete a user by ID.
   */
  async delete(id: string): Promise<void> {
    await prisma.user.delete({ where: { id } });
  },

  /**
   * Verify a region exists and return its name.
   */
  async verifyRegion(regionId: string) {
    return prisma.region.findUnique({
      where: { id: regionId },
      select: { id: true, name: true },
    });
  },

  /**
   * Count users matching a filter.
   */
  async count(where: Prisma.UserWhereInput = {}): Promise<number> {
    return prisma.user.count({ where });
  },
};
