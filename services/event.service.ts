import { eventRepository } from "@/repositories/event.repository";
import { permitterRepository } from "@/repositories/permitter.repository";
import type { EventQueryParams, EventResponse, EventStatus, PaginatedResponse } from "@/types/event";
import type { ActorContext } from "@/types/auth";
import { AppError } from "@/lib/errors";
import { canAccessRegion, applyRegionFilter } from "@/lib/scope";

function toEventResponse(event: {
  id: string;
  permitterId: string;
  regionId: string;
  venueName: string;
  venueAddress: string;
  eventDate: Date;
  createdAt: Date;
  updatedAt: Date;
  permitter: {
    id: string;
    permitterId: string;
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
  region: { id: string; name: string };
}): EventResponse {
  const status = eventRepository.computeStatus(event.eventDate);

  return {
    id: event.id,
    permitterId: event.permitterId,
    regionId: event.regionId,
    regionName: event.region.name,
    venueName: event.venueName,
    venueAddress: event.venueAddress,
    eventDate: event.eventDate.toISOString(),
    status: status as EventStatus,
    permitterName: event.permitter.permitter.name,
    permitterUser: event.permitter.permitter,
    spg: event.permitter.spg,
    schools: event.permitter.schools.map((s) => ({
      id: s.id,
      name: s.name,
      schoolAddress: s.schoolAddress,
      totalStudents: s.totalStudents,
      picName: s.picName,
      picPhone: s.picPhone,
      order: s.order,
    })),
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  };
}

export const eventService = {
  async list(
    actor: ActorContext,
    params: EventQueryParams
  ): Promise<PaginatedResponse<EventResponse>> {
    const filteredParams = applyRegionFilter(params, actor);
    const { page = 1, limit = 10 } = filteredParams;

    // Status filtering is now handled at the DB level via date-based filtering
    // in eventRepository.findAll() — no need to filter in-memory anymore
    const { events, total } = await eventRepository.findAll(filteredParams);

    const mappedEvents = events.map(toEventResponse);

    return {
      items: mappedEvents,
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

    if (!canAccessRegion(actor.regionId, event.regionId, actor.scope)) {
      throw new AppError("Forbidden: you do not have access to this event", 403);
    }

    return toEventResponse(event);
  },

  async createFromPermitter(
    permitterId: string,
    regionId: string,
    venueName: string,
    venueAddress: string,
    eventDate: Date
  ): Promise<EventResponse> {
    // Check that no event already exists for this permitter
    const existingEvent = await eventRepository.findByPermitterId(permitterId);
    if (existingEvent) {
      // Event already exists, just return it
      const event = await eventRepository.findById(existingEvent.id);
      if (!event) throw new AppError("Event not found", 404);
      return toEventResponse(event);
    }

    const event = await eventRepository.create({
      permitterId,
      regionId,
      venueName,
      venueAddress,
      eventDate,
    });

    return toEventResponse(event);
  },

  async update(
    actor: ActorContext,
    id: string,
    data: { regionId?: string; venueName?: string; venueAddress?: string; eventDate?: string }
  ): Promise<EventResponse> {
    const existing = await eventRepository.findById(id);
    if (!existing) {
      throw new AppError("Event not found", 404);
    }

    if (!canAccessRegion(actor.regionId, existing.regionId, actor.scope)) {
      throw new AppError("Forbidden: you do not have access to this event", 403);
    }

    const updateData: Record<string, unknown> = {};
    if (data.regionId) updateData.regionId = data.regionId;
    if (data.venueName) updateData.venueName = data.venueName;
    if (data.venueAddress) updateData.venueAddress = data.venueAddress;
    if (data.eventDate) updateData.eventDate = new Date(data.eventDate);

    const event = await eventRepository.update(id, updateData as Parameters<typeof eventRepository.update>[1]);
    return toEventResponse(event);
  },

  async delete(actor: ActorContext, id: string): Promise<void> {
    const existing = await eventRepository.findById(id);
    if (!existing) {
      throw new AppError("Event not found", 404);
    }

    if (!canAccessRegion(actor.regionId, existing.regionId, actor.scope)) {
      throw new AppError("Forbidden: you do not have access to this event", 403);
    }

    // Delete event (cascade deletes Attendance, Selling, Contact)
    await eventRepository.delete(id);

    // Delete associated permitter to avoid orphan data
    try {
      await permitterRepository.delete(existing.permitterId);
    } catch {
      // Permitter may already be deleted, that's fine
    }
  },
};
