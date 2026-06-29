import { eventRepository } from "@/repositories/event.repository";
import type {
  CreateEventInput,
  UpdateEventInput,
  EventQueryParams,
  EventResponse,
  EventStatus,
  PaginatedResponse,
} from "@/types/event";
import type { ActorContext } from "@/types/auth";
import { AppError } from "@/lib/errors";
import { canAccessRegion, applyRegionFilter } from "@/lib/scope";

function toEventResponse(event: {
  id: string;
  permitterId: string;
  startTime: Date | null;
  endTime: Date | null;
  actualStartTime: Date | null;
  actualEndTime: Date | null;
  startedById: string | null;
  completedById: string | null;
  notes: string | null;
  photoUrl: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  permitter: {
    id: string;
    permitterId: string;
    spgId: string | null;
    regionId: string;
    cycle: string;
    venueName: string;
    venueAddress: string;
    venuePIC: string;
    eventDate: Date;
    permitter: { id: string; name: string };
    spg: { id: string; name: string } | null;
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
  };
}): EventResponse {
  return {
    id: event.id,
    permitterId: event.permitterId,
    permitterName: event.permitter.permitter.name,
    regionId: event.permitter.regionId,
    regionName: event.permitter.region.name,
    cycle: event.permitter.cycle,
    venueName: event.permitter.venueName,
    venueAddress: event.permitter.venueAddress,
    venuePIC: event.permitter.venuePIC,
    eventDate: event.permitter.eventDate,
    startTime: event.startTime,
    endTime: event.endTime,
    actualStartTime: event.actualStartTime,
    actualEndTime: event.actualEndTime,
    startedById: event.startedById,
    completedById: event.completedById,
    notes: event.notes,
    photoUrl: event.photoUrl,
    status: event.status as EventStatus,
    schools: event.permitter.schools.map((s) => ({
      id: s.id,
      name: s.name,
      schoolAddress: s.schoolAddress,
      totalStudents: s.totalStudents,
      picName: s.picName,
      picPhone: s.picPhone,
      order: s.order,
    })),
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  };
}

export const eventService = {
  async list(
    actor: ActorContext,
    params: EventQueryParams
  ): Promise<PaginatedResponse<EventResponse>> {
    const filteredParams = applyRegionFilter(params, actor);
    const { page = 1, limit = 10 } = filteredParams;
    const { events, total } = await eventRepository.findAll(filteredParams);

    return {
      items: events.map(toEventResponse),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async getById(actor: ActorContext, id: string): Promise<EventResponse> {
    const event = await eventRepository.findById(id);
    if (!event) {
      throw new AppError("Event not found", 404);
    }

    // Verify actor has access to this event's region
    if (!canAccessRegion(actor.regionId, event.permitter.regionId, actor.scope)) {
      throw new AppError("Forbidden: you do not have access to this event", 403);
    }

    return toEventResponse(event);
  },

  async create(
    actor: ActorContext,
    data: CreateEventInput
  ): Promise<EventResponse> {
    // Verify permitter exists and get its details
    const permitter = await eventRepository.findPermitterById(
      data.permitterId
    );
    if (!permitter) {
      throw new AppError("Permitter not found", 404);
    }

    // Verify actor has access to the permitter's region
    if (!canAccessRegion(actor.regionId, permitter.regionId, actor.scope)) {
      throw new AppError(
        "Forbidden: you do not have access to this permitter's region",
        403
      );
    }

    // Check that no event already exists for this permitter
    const existingEvent = await eventRepository.findByPermitterId(
      data.permitterId
    );
    if (existingEvent) {
      throw new AppError(
        "An event already exists for this permitter",
        409
      );
    }

    const event = await eventRepository.create(data);
    return toEventResponse(event);
  },

  async update(
    actor: ActorContext,
    id: string,
    data: UpdateEventInput
  ): Promise<EventResponse> {
    const existing = await eventRepository.findById(id);
    if (!existing) {
      throw new AppError("Event not found", 404);
    }

    // Verify actor has access to this event's region
    if (!canAccessRegion(actor.regionId, existing.permitter.regionId, actor.scope)) {
      throw new AppError("Forbidden: you do not have access to this event", 403);
    }

    const event = await eventRepository.update(id, data);
    return toEventResponse(event);
  },

  async delete(actor: ActorContext, id: string): Promise<void> {
    const existing = await eventRepository.findById(id);
    if (!existing) {
      throw new AppError("Event not found", 404);
    }

    // Verify actor has access to this event's region
    if (!canAccessRegion(actor.regionId, existing.permitter.regionId, actor.scope)) {
      throw new AppError("Forbidden: you do not have access to this event", 403);
    }

    await eventRepository.delete(id);
  },
};
