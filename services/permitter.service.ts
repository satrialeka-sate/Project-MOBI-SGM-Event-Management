import { permitterRepository } from "@/repositories/permitter.repository";
import type {
  CreatePermitterInput,
  UpdatePermitterInput,
  PermitterQueryParams,
  PermitterResponse,
  PaginatedResponse,
} from "@/types/permitter";
import { AppError } from "@/lib/errors";

function toPermitterResponse(permitter: {
  id: string;
  permitterId: string;
  regionId: string;
  cycle: string;
  venueName: string;
  venueAddress: string;
  venuePIC: string;
  venuePICPhone: string;
  eventDate: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  permitter: { id: string; name: string; regionId: string };
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
    regionId: permitter.regionId,
    regionName: permitter.region.name,
    cycle: permitter.cycle,
    venueName: permitter.venueName,
    venueAddress: permitter.venueAddress,
    venuePIC: permitter.venuePIC,
    venuePICPhone: permitter.venuePICPhone,
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
