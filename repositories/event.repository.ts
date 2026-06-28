import { prisma } from "@/lib/prisma";
import type { Prisma, $Enums } from "@prisma/client";
import type { CreateEventInput, UpdateEventInput, EventQueryParams } from "@/types/event";

const eventPermitterInclude = {
  permitter: { select: { id: true, name: true } },
  spg: { select: { id: true, name: true } },
  region: { select: { id: true, name: true } },
  schools: {
    orderBy: { order: "asc" as const },
  },
} satisfies Prisma.PermitterInclude;

type PermitterForEvent = Prisma.PermitterGetPayload<{ include: typeof eventPermitterInclude }>;

interface FindAllResult {
  events: Array<{
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
    permitter: PermitterForEvent;
  }>;
  total: number;
}

export const eventRepository = {
  async findAll(params: EventQueryParams): Promise<FindAllResult> {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      regionId,
      permitterId,
      spgId,
      sortBy = "eventDate",
      sortOrder = "desc",
    } = params;

    const where: Prisma.EventWhereInput = {};
    let permitterFilter: Prisma.PermitterWhereInput = {};

    if (search) {
      permitterFilter = {
        OR: [
          { venueName: { contains: search, mode: "insensitive" } },
          { permitter: { name: { contains: search, mode: "insensitive" } } },
        ],
      };
    }

    if (status) {
      where.status = status as $Enums.EventStatus;
    }

    if (regionId) {
      permitterFilter = { ...permitterFilter, regionId };
    }

    if (permitterId) {
      where.permitterId = permitterId;
    }

    if (spgId) {
      permitterFilter = { ...permitterFilter, spgId };
    }

    if (Object.keys(permitterFilter).length > 0) {
      where.permitter = permitterFilter;
    }

    const orderBy: Prisma.EventOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const include = {
      permitter: {
        include: eventPermitterInclude,
      },
    } satisfies Prisma.EventInclude;

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include,
      }),
      prisma.event.count({ where }),
    ]);

    return { events, total };
  },

  async findById(id: string) {
    return prisma.event.findUnique({
      where: { id },
      include: {
        permitter: {
          include: eventPermitterInclude,
        },
      },
    });
  },

  async findByPermitterId(permitterId: string) {
    return prisma.event.findUnique({
      where: { permitterId },
    });
  },

  async findPermitterById(id: string) {
    return prisma.permitter.findUnique({
      where: { id },
      include: {
        permitter: { select: { id: true, name: true, role: true } },
        region: { select: { id: true, name: true } },
      },
    });
  },

  async create(data: CreateEventInput) {
    return prisma.event.create({
      data: {
        permitterId: data.permitterId,
      },
      include: {
        permitter: {
          include: eventPermitterInclude,
        },
      },
    });
  },

  async update(id: string, data: UpdateEventInput) {
    return prisma.event.update({
      where: { id },
      data,
      include: {
        permitter: {
          include: eventPermitterInclude,
        },
      },
    });
  },

  async delete(id: string) {
    return prisma.event.delete({ where: { id } });
  },
};
