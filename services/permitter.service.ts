import { permitterRepository } from "@/repositories/permitter.repository";
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

/**
 * Enforce region-scoped actor: if actor has REGION scope,
 * force the given regionId to the actor's regionId.
 * Returns the (possibly overridden) regionId.
 */
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

    // Verify actor has access to this permitter's region
    if (!canAccessRegion(actor.regionId, permitter.regionId, actor.scope)) {
      throw new AppError("Forbidden: you do not have access to this permitter", 403);
    }

    return toPermitterResponse(permitter);
  },

  async create(
    actor: ActorContext,
    data: CreatePermitterInput
  ): Promise<PermitterResponse> {
    // Enforce region scope: REGION users can only create in their own region
    const resolvedRegionId = enforceRegionScope(data.regionId, actor);

    // Validate eventDate is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (data.eventDate < today) {
      throw new AppError("Event date cannot be in the past", 400, [
        "Select today or a future date",
      ]);
    }

    // Verify region exists
    const region = await permitterRepository.verifyRegionExists(resolvedRegionId);
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

    const permitter = await permitterRepository.createInTransaction({
      ...data,
      regionId: resolvedRegionId,
    });
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

    // Verify actor has access to this permitter's region
    if (!canAccessRegion(actor.regionId, existing.regionId, actor.scope)) {
      throw new AppError("Forbidden: you do not have access to this permitter", 403);
    }

    // Enforce region scope: REGION users cannot change regionId
    const resolvedRegionId = enforceRegionScope(
      data.regionId ?? existing.regionId,
      actor
    );

    // Verify references if they are being changed
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
    return toPermitterResponse(permitter);
  },

  async delete(actor: ActorContext, id: string): Promise<void> {
    const existing = await permitterRepository.findById(id);
    if (!existing) {
      throw new AppError("Permitter not found", 404);
    }

    // Verify actor has access to this permitter's region
    if (!canAccessRegion(actor.regionId, existing.regionId, actor.scope)) {
      throw new AppError("Forbidden: you do not have access to this permitter", 403);
    }

    await permitterRepository.delete(id);
  },
};
