import { userRepository } from "@/repositories/user.repository";
import { UserStatus } from "@/constants/prisma-enums";
import { AppError } from "@/lib/errors";
import { isLegacyRegion, isOperationalRegion } from "@/constants/regions";
import bcrypt from "bcrypt";

/** Allowed roles for self-registration */
const ALLOWED_SELF_REGISTER_ROLES = new Set(["SPG", "PERMITTER"]);

/** TL (Team Leader) maps to role=SPG, level=TEAM_LEADER in the system */
const TEAM_LEADER = "TL";

/** Role-to-level mapping for self-registration */
const SELF_REGISTER_LEVELS: Record<string, string> = {
  SPG: "SPG",
  PERMITTER: "Permitter",
};

/** Valid state transitions for user approval */
const VALID_STATUS_TRANSITIONS: Record<string, Set<string>> = {
  [UserStatus.PENDING]: new Set([UserStatus.ACTIVE, UserStatus.REJECTED]),
};

/**
 * Validate that a status transition is allowed.
 */
function assertValidStatusTransition(
  currentStatus: string,
  targetStatus: string
): void {
  const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus];
  if (!allowedTransitions || !allowedTransitions.has(targetStatus)) {
    throw new AppError(
      `Cannot transition from ${currentStatus} to ${targetStatus}. Only PENDING users can be approved/rejected.`,
      400
    );
  }
}

/**
 * Resolve role and level from a self-registration role string.
 */
function resolveRegistrationRole(role: string): { userRole: string; userLevel: string } {
  if (role === TEAM_LEADER) {
    return { userRole: "SPG", userLevel: "TEAM_LEADER" };
  }

  if (ALLOWED_SELF_REGISTER_ROLES.has(role)) {
    return { userRole: role, userLevel: SELF_REGISTER_LEVELS[role] || role };
  }

  throw new AppError(
    "Invalid role. Allowed roles: SPG, Team Leader, PERMITTER",
    422
  );
}

/**
 * Generate a unique username from email, appending a timestamp if needed.
 */
async function generateUniqueUsername(email: string): Promise<string> {
  const suggestedUsername = email.split("@")[0];
  const existing = await userRepository.findByUsername(suggestedUsername);
  if (existing) {
    return `${suggestedUsername}-${Date.now()}`;
  }
  return suggestedUsername;
}

export const userService = {
  /**
   * Register a new user (self-registration).
   * Sets status to PENDING and requires ADMIN PO approval.
   */
  async register(data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role: string;
    regionId: string;
  }) {
    const { name, email, password, phone, role, regionId } = data;

    // Validate region exists and is operational
    const region = await userRepository.verifyRegion(regionId);
    if (!region) {
      throw new AppError("Region not found", 404);
    }
    if (isLegacyRegion(region.name)) {
      throw new AppError(`${region.name} is not a valid operational region`, 400);
    }
    if (!isOperationalRegion(region.name)) {
      throw new AppError(`${region.name} is not a valid operational region`, 400);
    }

    // Check unique email
    const existingEmail = await userRepository.findByEmail(email.toLowerCase().trim());
    if (existingEmail) {
      throw new AppError("Email already registered", 409);
    }

    // Resolve role and level
    const { userRole, userLevel } = resolveRegistrationRole(role);

    // Generate unique username from email prefix
    const username = await generateUniqueUsername(email);

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Determine the business role label for self-registration
    const businessRoleLabel =
      role === TEAM_LEADER
        ? "Team Leader"
        : SELF_REGISTER_LEVELS[role] || role;

    // Create user with PENDING status
    const user = await userRepository.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      username,
      password: hashedPassword,
      phone: phone?.trim() || null,
      role: userRole as any,
      level: userLevel as any,
      businessRole: businessRoleLabel,
      scope: "REGION",
      regionId,
      status: UserStatus.PENDING,
      isActive: true,
    });

    return user;
  },

  /**
   * Approve a user (transition from PENDING to ACTIVE).
   * Only ADMIN PO can perform this action.
   */
  async approveUser(id: string, approvedBy: string) {
    const existing = await userRepository.findById(id);
    if (!existing) {
      throw new AppError("User not found", 404);
    }

    assertValidStatusTransition(existing.status, UserStatus.ACTIVE);

    const updated = await userRepository.updateStatus(id, {
      status: UserStatus.ACTIVE,
      isActive: true,
      approvedBy,
      approvedAt: new Date(),
      rejectedBy: null,
      rejectedAt: null,
      rejectionReason: null,
    });

    return updated;
  },

  /**
   * Reject a user (transition from PENDING to REJECTED).
   * Only ADMIN PO can perform this action.
   */
  async rejectUser(id: string, rejectedBy: string, rejectionReason?: string) {
    const existing = await userRepository.findById(id);
    if (!existing) {
      throw new AppError("User not found", 404);
    }

    assertValidStatusTransition(existing.status, UserStatus.REJECTED);

    const updated = await userRepository.updateStatus(id, {
      status: UserStatus.REJECTED,
      isActive: false,
      rejectedBy,
      rejectedAt: new Date(),
      rejectionReason: rejectionReason || null,
      approvedBy: null,
      approvedAt: null,
    });

    return updated;
  },

  /**
   * List all users with optional filters.
   */
  async list(where: { role?: string; regionId?: string } = {}) {
    const prismaWhere: Record<string, unknown> = {};
    if (where.role) {
      prismaWhere.role = where.role;
    }
    if (where.regionId) {
      prismaWhere.regionId = where.regionId;
    }
    return userRepository.findAll(prismaWhere as any);
  },

  /**
   * Get a single user by ID.
   */
  async getById(id: string) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    return user;
  },

  /**
   * Update a user (admin panel).
   */
  async update(id: string, data: Record<string, unknown>) {
    const existing = await userRepository.findById(id);
    if (!existing) {
      throw new AppError("User not found", 404);
    }

    // Check unique email if changing
    if (data.email && data.email !== existing.email) {
      const emailUser = await userRepository.findByEmail(data.email as string);
      if (emailUser) {
        throw new AppError("Email already exists", 409);
      }
    }

    // Check unique username if changing
    if (data.username && data.username !== existing.username) {
      const usernameUser = await userRepository.findByUsername(data.username as string);
      if (usernameUser) {
        throw new AppError("Username already exists", 409);
      }
    }

    // Hash password if provided
    const updateData: Record<string, unknown> = { ...data };
    if (data.password) {
      if ((data.password as string).length < 8) {
        throw new AppError("Password must be at least 8 characters", 422);
      }
      updateData.password = await bcrypt.hash(data.password as string, 12);
    } else {
      delete updateData.password;
    }

    return userRepository.update(id, updateData as any);
  },

  /**
   * Delete a user.
   */
  async delete(id: string, currentUserId: string) {
    const existing = await userRepository.findById(id);
    if (!existing) {
      throw new AppError("User not found", 404);
    }

    if (id === currentUserId) {
      throw new AppError("Cannot delete your own account", 400);
    }

    await userRepository.delete(id);
  },
};
