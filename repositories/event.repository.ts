import { prisma } from "@/lib/prisma";
import type { Prisma } from "../generated/prisma/client";
import type { EventQueryParams } from "@/types/event";

const eventInclude = {
  permitter: {
    include: {
      permitter: { select: { id: true, name: true } },
      spg: { select: { id: true, name: true } },
      region: { select: { id: true, name: true } },
      schools: {
        orderBy: { order: "asc" as const },
      },
    },
  },
  region: { select: { id: true, name: true } },
} satisfies Prisma.EventInclude;

type EventWithRelations = Prisma.EventGetPayload<{ include: typeof eventInclude }>;

interface FindAllResult {
  events: EventWithRelations[];
  total: number;
}

function computeStatus(eventDate: Date): "UPCOMING" | "ONGOING" | "COMPLETED" {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const evDate = new Date(eventDate);
  evDate.setHours(0, 0, 0, 0);

  if (evDate.getTime() === today.getTime()) return "ONGOING";
  if (evDate > today) return "UPCOMING";
  return "COMPLETED";
}

/**
 * Convert a status filter to a date-based Prisma where clause.
 * This ensures pagination works correctly with computed status.
 */
function statusToDateFilter(status?: string): Prisma.DateTimeFilter | undefined {
  if (!status) return undefined;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  switch (status) {
    case "ONGOING":
      return { gte: today, lte: endOfDay };
    case "UPCOMING":
      return { gt: endOfDay };
    case "COMPLETED":
      return { lt: today };
    default:
      return undefined;
  }
}

export const eventRepository = {
  async findAll(params: EventQueryParams): Promise<FindAllResult> {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      regionId,
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

    if (regionId) {
      where.regionId = regionId;
    }

    // Convert status filter to date-based filter for correct pagination
    const dateFilter = statusToDateFilter(status);
    if (dateFilter) {
      where.eventDate = dateFilter;
    }

    if (Object.keys(permitterFilter).length > 0) {
      where.permitter = permitterFilter;
    }

    const orderBy: Prisma.EventOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: eventInclude,
      }),
      prisma.event.count({ where }),
    ]);

    return { events, total };
  },

  async findById(id: string) {
    return prisma.event.findUnique({
      where: { id },
      include: eventInclude,
    });
  },

  async findByPermitterId(permitterId: string) {
    return prisma.event.findUnique({
      where: { permitterId },
    });
  },

  async create(data: {
    permitterId: string;
    regionId: string;
    venueName: string;
    venueAddress: string;
    eventDate: Date;
  }) {
    return prisma.event.create({
      data: {
        permitterId: data.permitterId,
        regionId: data.regionId,
        venueName: data.venueName,
        venueAddress: data.venueAddress,
        eventDate: data.eventDate,
      },
      include: eventInclude,
    });
  },

  async update(id: string, data: {
    regionId?: string;
    venueName?: string;
    venueAddress?: string;
    eventDate?: Date;
  }) {
    return prisma.event.update({
      where: { id },
      data,
      include: eventInclude,
    });
  },

  async delete(id: string) {
    return prisma.event.delete({ where: { id } });
  },

  computeStatus,
};
