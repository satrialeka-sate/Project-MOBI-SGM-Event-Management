import { permitterRepository } from "@/repositories/permitter.repository";
import { eventRepository } from "@/repositories/event.repository";
import { getCycleFromDate } from "@/lib/cycle";
import type {
  CreatePermitterInput,
  UpdatePermitterInput,
  PermitterQueryParams,
  PermitterResponse,
  PaginatedResponse,
} from "@/types/permitter";
import type { ActorContext } from "@/types/auth";
import { AppError } from "@/lib/errors";
import { canAccessRegion, applyRegionFilter, isRegionScope } from "@/lib/scope";

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

function enforceRegionScope(
  regionId: string,
  actor: ActorContext
): string {
  if (isRegionScope(actor.scope)) {
    return actor.regionId;
  }
  return regionId;
}

export const permitterService = {
  async list(
    actor: ActorContext,
    params: PermitterQueryParams
  ): Promise<PaginatedResponse<PermitterResponse>> {
    const filteredParams = applyRegionFilter(params, actor);
    const { page = 1, limit = 10 } = filteredParams;
    const { permitters, total } = await permitterRepository.findAll(filteredParams);

    return {
      items: permitters.map(toPermitterResponse),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async getById(actor: ActorContext, id: string): Promise<PermitterResponse> {
    const permitter = await permitterRepository.findById(id);
    if (!permitter) {
      throw new AppError("Permitter not found", 404);
    }

    if (!canAccessRegion(actor.regionId, permitter.regionId, actor.scope)) {
      throw new AppError("Forbidden: you do not have access to this permitter", 403);
    }

    return toPermitterResponse(permitter);
  },

  async create(
    actor: ActorContext,
    data: CreatePermitterInput
  ): Promise<PermitterResponse> {
    const resolvedRegionId = enforceRegionScope(data.regionId, actor);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (data.eventDate < today) {
      throw new AppError("Event date cannot be in the past", 400, [
        "Select today or a future date",
      ]);
    }

    const region = await permitterRepository.verifyRegionExists(resolvedRegionId);
    if (!region) {
      throw new AppError("Region not found", 404);
    }

    const permitterUser = await permitterRepository.verifyUserExists(
      data.permitterId
    );
    if (!permitterUser) {
      throw new AppError("Permitter user not found", 404);
    }

    const cycle = getCycleFromDate(data.eventDate) ?? "Outside Cycle";

    const permitter = await permitterRepository.createInTransaction({
      ...data,
      cycle,
      regionId: resolvedRegionId,
    });

    // Auto-create Event from this permitter (idempotent: checks for duplicates)
    const existingEvent = await eventRepository.findByPermitterId(permitter.id);
    if (!existingEvent) {
      await eventRepository.create({
        permitterId: permitter.id,
        regionId: permitter.regionId,
        venueName: permitter.venueName,
        venueAddress: permitter.venueAddress,
        eventDate: permitter.eventDate,
      }).catch((err) => {
        console.error("Failed to auto-create event:", err);
      });
    }

    return toPermitterResponse(permitter);
  },

  async update(
    actor: ActorContext,
    id: string,
    data: UpdatePermitterInput
  ): Promise<PermitterResponse> {
    const existing = await permitterRepository.findById(id);
    if (!existing) {
      throw new AppError("Permitter not found", 404);
    }

    if (!canAccessRegion(actor.regionId, existing.regionId, actor.scope)) {
      throw new AppError("Forbidden: you do not have access to this permitter", 403);
    }

    const resolvedRegionId = enforceRegionScope(
      data.regionId ?? existing.regionId,
      actor
    );

    if (resolvedRegionId !== existing.regionId) {
      const region = await permitterRepository.verifyRegionExists(resolvedRegionId);
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

    const updatePayload: UpdatePermitterInput = { ...data, regionId: resolvedRegionId };
    if (data.eventDate) {
      // Only recalculate cycle if the eventDate actually changed
      const existingDate = existing.eventDate;
      const newDate = data.eventDate;
      const isSameDate =
        existingDate.getUTCFullYear() === newDate.getUTCFullYear() &&
        existingDate.getUTCMonth() === newDate.getUTCMonth() &&
        existingDate.getUTCDate() === newDate.getUTCDate();

      if (!isSameDate) {
        updatePayload.cycle = getCycleFromDate(data.eventDate) ?? "Outside Cycle";
      }
    }

    const permitter = await permitterRepository.updateInTransaction(id, updatePayload);

    return toPermitterResponse(permitter);
  },

  async delete(actor: ActorContext, id: string): Promise<void> {
    const existing = await permitterRepository.findById(id);
    if (!existing) {
      throw new AppError("Permitter not found", 404);
    }

    if (!canAccessRegion(actor.regionId, existing.regionId, actor.scope)) {
      throw new AppError("Forbidden: you do not have access to this permitter", 403);
    }

    // Delete associated event first if it exists (cascade will handle Attendance/Selling/Contact)
    const event = await eventRepository.findByPermitterId(id);
    if (event) {
      await eventRepository.delete(event.id);
    }

    await permitterRepository.delete(id);
  },
};
