import { attendanceRepository } from "@/repositories/attendance.repository";
import { eventRepository } from "@/repositories/event.repository";
import type {
  CreateAttendanceInput,
  UpdateAttendanceInput,
  AttendanceResponse,
  PaginatedResponse,
} from "@/types/attendance";
import type { ActorContext } from "@/types/auth";
import { AppError } from "@/lib/errors";
import { canAccessRegion } from "@/lib/scope";

function toAttendanceResponse(attendance: {
  id: string;
  eventId: string;
  userId: string;
  photo: string;
  attendanceAt: Date;
  createdAt: Date;
  updatedAt: Date;
  user?: { id: string; name: string };
}): AttendanceResponse {
  return {
    id: attendance.id,
    eventId: attendance.eventId,
    userId: attendance.userId,
    userName: attendance.user?.name,
    photo: attendance.photo,
    attendanceAt: attendance.attendanceAt.toISOString(),
    createdAt: attendance.createdAt.toISOString(),
    updatedAt: attendance.updatedAt.toISOString(),
  };
}

export const attendanceService = {
  async list(
    actor: ActorContext,
    eventId: string,
    params: { page?: number; limit?: number }
  ): Promise<PaginatedResponse<AttendanceResponse>> {
    const event = await eventRepository.findById(eventId);
    if (!event) {
      throw new AppError("Event not found", 404);
    }
    if (!canAccessRegion(actor.regionId, event.regionId, actor.scope)) {
      throw new AppError("Forbidden: you do not have access to this event", 403);
    }

    const { page = 1, limit = 10 } = params;
    const { attendances, total } = await attendanceRepository.findByEventId({
      eventId,
      page,
      limit,
    });

    return {
      items: attendances.map(toAttendanceResponse),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async getMyAttendance(
    actor: ActorContext,
    eventId: string
  ): Promise<AttendanceResponse | null> {
    const event = await eventRepository.findById(eventId);
    if (!event) {
      throw new AppError("Event not found", 404);
    }
    if (!canAccessRegion(actor.regionId, event.regionId, actor.scope)) {
      throw new AppError("Forbidden: you do not have access to this event", 403);
    }

    const attendance = await attendanceRepository.findByEventAndUser(
      eventId,
      actor.id
    );
    return attendance ? toAttendanceResponse(attendance) : null;
  },

  async create(
    actor: ActorContext,
    eventId: string,
    data: CreateAttendanceInput
  ): Promise<AttendanceResponse> {
    const event = await eventRepository.findById(eventId);
    if (!event) {
      throw new AppError("Event not found", 404);
    }
    if (!canAccessRegion(actor.regionId, event.regionId, actor.scope)) {
      throw new AppError("Forbidden: you do not have access to this event", 403);
    }

    // Photo format & size validation is handled by Zod schema at the API layer.
    // Enforce one attendance per user per event using Prisma's unique constraint
    // @@unique([eventId, userId]) on Attendance model handles this at DB level.
    try {
      const attendance = await attendanceRepository.create({
        eventId,
        userId: actor.id,
        photo: data.photo,
      });

      return toAttendanceResponse(attendance);
    } catch (err: unknown) {
      // Handle Prisma unique constraint violation
      if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "P2002") {
        throw new AppError(
          "You have already submitted attendance for this event. Use update to change your photo.",
          409
        );
      }
      throw err;
    }
  },

  async delete(
    actor: ActorContext,
    id: string
  ): Promise<void> {
    const existing = await attendanceRepository.findById(id);
    if (!existing) {
      throw new AppError("Attendance not found", 404);
    }

    const event = await eventRepository.findById(existing.eventId);
    if (!event) {
      throw new AppError("Event not found", 404);
    }
    if (!canAccessRegion(actor.regionId, event.regionId, actor.scope)) {
      throw new AppError("Forbidden: you do not have access to this event", 403);
    }

    await attendanceRepository.delete(id);
  },

  async update(
    actor: ActorContext,
    id: string,
    data: UpdateAttendanceInput
  ): Promise<AttendanceResponse> {
    const existing = await attendanceRepository.findById(id);
    if (!existing) {
      throw new AppError("Attendance not found", 404);
    }

    // Only the original user can update their own attendance
    if (existing.userId !== actor.id) {
      throw new AppError("Forbidden: you can only update your own attendance", 403);
    }

    const event = await eventRepository.findById(existing.eventId);
    if (!event) {
      throw new AppError("Event not found", 404);
    }
    if (!canAccessRegion(actor.regionId, event.regionId, actor.scope)) {
      throw new AppError("Forbidden: you do not have access to this event", 403);
    }

    const attendance = await attendanceRepository.update(id, data);
    return toAttendanceResponse(attendance);
  },
};
