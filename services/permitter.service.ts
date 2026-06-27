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
  spgId: string;
  venueId: string;
  eventDate: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  permitter: { id: string; name: string };
  spg: { id: string; name: string };
  venue: {
    id: string;
    name: string;
    regionId: string;
    region: { name: string };
  };
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
    venueId: permitter.venueId,
    venueName: permitter.venue.name,
    regionId: permitter.venue.regionId,
    regionName: permitter.venue.region.name,
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
    // Verify venue exists
    const venue = await permitterRepository.verifyVenueExists(data.venueId);
    if (!venue) {
      throw new AppError("Venue not found", 404);
    }

    // Verify permitter user exists
    const permitterUser = await permitterRepository.verifyUserExists(
      data.permitterId
    );
    if (!permitterUser) {
      throw new AppError("Permitter user not found", 404);
    }

    // Verify SPG user exists
    const spgUser = await permitterRepository.verifyUserExists(data.spgId);
    if (!spgUser) {
      throw new AppError("SPG user not found", 404);
    }

    // Check for conflicting event (same venue, same date)
    const conflict = await permitterRepository.findConflicting(
      data.venueId,
      data.eventDate
    );
    if (conflict) {
      throw new AppError(
        "A permitter event already exists for this venue on the selected date",
        409
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
    if (data.venueId) {
      const venue = await permitterRepository.verifyVenueExists(data.venueId);
      if (!venue) {
        throw new AppError("Venue not found", 404);
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
    }

    // Check for conflict if venueId or eventDate is being changed
    const newVenueId = data.venueId ?? existing.venueId;
    const newEventDate = data.eventDate ?? existing.eventDate;
    if (data.venueId || data.eventDate) {
      const conflict = await permitterRepository.findConflicting(
        newVenueId,
        newEventDate,
        id
      );
      if (conflict) {
        throw new AppError(
          "A permitter event already exists for this venue on the selected date",
          409
        );
      }
    }

    const permitter = await permitterRepository.updateInTransaction(id, data);
    return toPermitterResponse(permitter!);
  },

  async delete(id: string): Promise<void> {
    const existing = await permitterRepository.findById(id);
    if (!existing) {
      throw new AppError("Permitter not found", 404);
    }

    await permitterRepository.delete(id);
  },
};
