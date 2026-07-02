import { permitterRepository } from "@/repositories/permitter.repository";
import { eventRepository } from "@/repositories/event.repository";
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
    status: String(permitter.status),
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

/**
 * Auto-create an Event when a Permitter is APPROVED.
 * Idempotent: if Event already exists, return it instead of creating duplicate.
 */
async function handlePermitterApproved(permitter: {
  id: string;
  regionId: string;
  venueName: string;
  venueAddress: string;
  eventDate: Date;
}): Promise<void> {
  const existingEvent = await eventRepository.findByPermitterId(permitter.id);
  if (existingEvent) {
    return; // Idempotent: event already exists
  }

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

/**
 * Delete the associated Event when a Permitter status changes away from APPROVED.
 */
async function handlePermitterUnapproved(permitterId: string): Promise<void> {
  const existingEvent = await eventRepository.findByPermitterId(permitterId);
  if (existingEvent) {
    await eventRepository.delete(existingEvent.id).catch((err) => {
      console.error("Failed to delete event on permitter rejection:", err);
    });
  }
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

    const permitter = await permitterRepository.createInTransaction({
      ...data,
      status: "PENDING",
      regionId: resolvedRegionId,
    });

    // ✅ Event NOT created here — only created when status changes to APPROVED

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

    const permitter = await permitterRepository.updateInTransaction(id, {
      ...data,
      regionId: resolvedRegionId,
    });

    // ✅ Handle APPROVED → create event (idempotent)
    if (data.status === "APPROVED") {
      await handlePermitterApproved(permitter);
    }

    // ✅ Handle REJECTED (or other non-APPROVED statuses) → delete event
    if (data.status && data.status !== "APPROVED" && existing.status === "APPROVED") {
      await handlePermitterUnapproved(permitter.id);
    }

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

    // Delete associated event first if it exists (cascade will handle rest)
    const event = await eventRepository.findByPermitterId(id);
    if (event) {
      await eventRepository.delete(event.id);
    }

    await permitterRepository.delete(id);
  },
};
