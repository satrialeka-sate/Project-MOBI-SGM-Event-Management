import { eventRepository } from "@/repositories/event.repository";
import type {
  CreateEventInput,
  UpdateEventInput,
  EventQueryParams,
  EventResponse,
  EventStatus,
  PaginatedResponse,
} from "@/types/event";
import { AppError } from "@/lib/errors";
import { ROLES } from "@/constants/roles";

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
  updatedAt: Date;    permitter: {
    id: string;
    permitterId: string;
    spgId: string;
    venueId: string;
    eventDate: Date;
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
  };
}): EventResponse {
  return {
    id: event.id,
    permitterId: event.permitterId,
    permitterName: event.permitter.permitter.name,
    spgId: event.permitter.spgId,
    spgName: event.permitter.spg.name,
    venueId: event.permitter.venueId,
    venueName: event.permitter.venue.name,
    regionId: event.permitter.venue.regionId,
    regionName: event.permitter.venue.region.name,
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
    params: EventQueryParams
  ): Promise<PaginatedResponse<EventResponse>> {
    const { page = 1, limit = 10 } = params;
    const { events, total } = await eventRepository.findAll(params);

    return {
      items: events.map(toEventResponse),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async getById(id: string): Promise<EventResponse> {
    const event = await eventRepository.findById(id);
    if (!event) {
      throw new AppError("Event not found", 404);
    }
    return toEventResponse(event);
  },

  async create(data: CreateEventInput): Promise<EventResponse> {
    // Verify permitter exists and get its details
    const permitter = await eventRepository.findPermitterById(
      data.permitterId
    );
    if (!permitter) {
      throw new AppError("Permitter not found", 404);
    }

    // Verify SPG has SPG role
    if (permitter.spg.role !== ROLES.SPG) {
      throw new AppError(
        "Assigned SPG user must have the SPG role",
        400
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
    id: string,
    data: UpdateEventInput
  ): Promise<EventResponse> {
    const existing = await eventRepository.findById(id);
    if (!existing) {
      throw new AppError("Event not found", 404);
    }

    const event = await eventRepository.update(id, data);
    return toEventResponse(event);
  },

  async delete(id: string): Promise<void> {
    const existing = await eventRepository.findById(id);
    if (!existing) {
      throw new AppError("Event not found", 404);
    }

    await eventRepository.delete(id);
  },
};
