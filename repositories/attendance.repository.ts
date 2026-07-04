import { prisma } from "@/lib/prisma";
import type { Prisma } from "../generated/prisma/client";

const attendanceInclude = {
  event: { select: { id: true, venueName: true } },
  user: { select: { id: true, name: true } },
} satisfies Prisma.AttendanceInclude;

interface FindAllParams {
  eventId: string;
  page?: number;
  limit?: number;
}

interface FindAllResult {
  attendances: Array<{
    id: string;
    eventId: string;
    userId: string;
    photo: string;
    attendanceAt: Date;
    createdAt: Date;
    updatedAt: Date;
    user: { id: string; name: string };
  }>;
  total: number;
}

export const attendanceRepository = {
  async findByEventId(params: FindAllParams): Promise<FindAllResult> {
    const { eventId, page = 1, limit = 10 } = params;

    const where: Prisma.AttendanceWhereInput = { eventId };

    const [attendances, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        orderBy: { attendanceAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: attendanceInclude,
      }),
      prisma.attendance.count({ where }),
    ]);

    return { attendances, total };
  },

  async findById(id: string) {
    return prisma.attendance.findUnique({
      where: { id },
      include: attendanceInclude,
    });
  },

  async findByEventAndUser(eventId: string, userId: string) {
    return prisma.attendance.findFirst({
      where: { eventId, userId },
    });
  },

  async create(data: {
    eventId: string;
    userId: string;
    photo: string;
  }) {
    return prisma.attendance.create({
      data: {
        eventId: data.eventId,
        userId: data.userId,
        photo: data.photo,
        attendanceAt: new Date(),
      },
      include: attendanceInclude,
    });
  },

  async update(id: string, data: { photo?: string }) {
    return prisma.attendance.update({
      where: { id },
      data,
      include: attendanceInclude,
    });
  },

  async delete(id: string) {
    return prisma.attendance.delete({ where: { id } });
  },
};
