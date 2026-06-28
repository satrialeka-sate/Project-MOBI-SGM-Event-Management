import { permitterRepository } from "@/repositories/permitter.repository";
import type {
  CreatePermitterInput,
  UpdatePermitterInput,
  PermitterQueryParams,
  PermitterResponse,
  PaginatedResponse,
} from "@/types/permitter";
import { AppError } from "@/lib/errors";
import { ROLES } from "@/constants/roles";

function toPermitterResponse(permitter: {
  id: string;
  permitterId: string;
  spgId: string;
  regionId: string;
  cycle: string;
  venueName: string;
  venueCity: string;
  venueAddress: string;
  venuePIC: string;
  eventDate: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  permitter: { id: string; name: string; regionId: string };
  spg: { id: string; name: string; regionId: string };
  region: { id: string; name: string };
  schools: Array<{
    id: string;
    name: string;
    schoolAddress: string;
    totalStudents: number;
    picName: string;
    picPhone: string;
    order: number;
  }>;
}): PermitterResponse {
  return {
    id: permitter.id,
    permitterId: permitter.permitterId,
    permitterName: permitter.permitter.name,
    spgId: permitter.spgId,
    spgName: permitter.spg.name,
    regionId: permitter.regionId,
    regionName: permitter.region.name,
    cycle: permitter.cycle,
    venueName: permitter.venueName,
    venueCity: permitter.venueCity,
    venueAddress: permitter.venueAddress,
    venuePIC: permitter.venuePIC,
    eventDate: permitter.eventDate,
    status: permitter.status,
    schools: permitter.schools.map((s) => ({
      id: s.id,
      name: s.name,
      schoolAddress: s.schoolAddress,
      totalStudents: s.totalStudents,
      picName: s.picName,
      picPhone: s.picPhone,
      order: s.order,
    })),
    createdAt: permitter.createdAt,
    updatedAt: permitter.updatedAt,
  };
}

export const permitterService = {
  async list(
    params: PermitterQueryParams
  ): Promise<PaginatedResponse<PermitterResponse>> {
    const { page = 1, limit = 10 } = params;
    const { permitters, total } = await permitterRepository.findAll(params);

    return {
      items: permitters.map(toPermitterResponse),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async getById(id: string): Promise<PermitterResponse> {
    const permitter = await permitterRepository.findById(id);
    if (!permitter) {
      throw new AppError("Permitter not found", 404);
    }
    return toPermitterResponse(permitter);
  },

  async create(data: CreatePermitterInput): Promise<PermitterResponse> {
    // Validate eventDate is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (data.eventDate < today) {
      throw new AppError("Event date cannot be in the past", 400, [
        "Select today or a future date",
      ]);
    }

    // Verify region exists
    const region = await permitterRepository.verifyRegionExists(data.regionId);
    if (!region) {
      throw new AppError("Region not found", 404);
    }

    // Verify permitter user exists
    const permitterUser = await permitterRepository.verifyUserExists(
      data.permitterId
    );
    if (!permitterUser) {
      throw new AppError("Permitter user not found", 404);
    }

    // Verify SPG user exists and get role + region info
    const spgUser = await permitterRepository.verifyUserExists(data.spgId);
    if (!spgUser) {
      throw new AppError("SPG user not found", 404);
    }

    // Verify SPG user has the SPG role
    if (spgUser.role !== ROLES.SPG) {
      throw new AppError(
        `User "${spgUser.name}" must have the SPG role to be assigned as SPG`,
        400
      );
    }

    // Verify SPG is in the same region as the planning
    if (spgUser.regionId !== data.regionId) {
      throw new AppError(
        "SPG user must belong to the same region as the planning",
        400,
        [
          `Planning region ID: ${data.regionId}`,
          `SPG user "${spgUser.name}" region ID: ${spgUser.regionId}`,
        ]
      );
    }

    const permitter = await permitterRepository.createInTransaction(data);
    return toPermitterResponse(permitter);
  },

  async update(
    id: string,
    data: UpdatePermitterInput
  ): Promise<PermitterResponse> {
    const existing = await permitterRepository.findById(id);
    if (!existing) {
      throw new AppError("Permitter not found", 404);
    }

    // Verify references if they are being changed
    if (data.regionId) {
      const region = await permitterRepository.verifyRegionExists(data.regionId);
      if (!region) {
        throw new AppError("Region not found", 404);
      }
    }

    if (data.permitterId) {
      const permitterUser = await permitterRepository.verifyUserExists(
        data.permitterId
      );
      if (!permitterUser) {
        throw new AppError("Permitter user not found", 404);
      }
    }

    if (data.spgId) {
      const spgUser = await permitterRepository.verifyUserExists(data.spgId);
      if (!spgUser) {
        throw new AppError("SPG user not found", 404);
      }

      // Verify new SPG has SPG role
      if (spgUser.role !== ROLES.SPG) {
        throw new AppError(
          `User "${spgUser.name}" must have the SPG role to be assigned as SPG`,
          400
        );
      }
    }

    const permitter = await permitterRepository.updateInTransaction(id, data);
    return toPermitterResponse(permitter);
  },

  async delete(id: string): Promise<void> {
    const existing = await permitterRepository.findById(id);
    if (!existing) {
      throw new AppError("Permitter not found", 404);
    }

    await permitterRepository.delete(id);
  },
};
