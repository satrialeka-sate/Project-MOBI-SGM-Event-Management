import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { CreatePermitterInput, UpdatePermitterInput, PermitterQueryParams } from "@/types/permitter";

interface FindAllResult {
  permitters: Array<{
    id: string;
    permitterId: string;
    spgId: string;
    venueId: string;
    eventDate: Date;
    status: string;
    createdAt: Date;
    updatedAt: Date;
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
  }>;
  total: number;
}

export const permitterRepository = {
  async findAll(params: PermitterQueryParams): Promise<FindAllResult> {
    const { page = 1, limit = 10, search, venueId, userId, date, status, sortBy = "eventDate", sortOrder = "desc" } = params;

    const where: Prisma.PermitterWhereInput = {};

    if (search) {
      where.OR = [
        { venue: { name: { contains: search, mode: "insensitive" } } },
        { permitter: { name: { contains: search, mode: "insensitive" } } },
        { spg: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (venueId) {
      where.venueId = venueId;
    }

    if (userId) {
      const userFilter: Prisma.PermitterWhereInput = {
        OR: [{ permitterId: userId }, { spgId: userId }],
      };
      if (search) {
        // If search is also active, use AND so search narrows the user filter
        const existingAnd = Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : [];
        where.AND = [...existingAnd, userFilter];
      } else {
        where.OR = [...(where.OR || []), ...(userFilter.OR as Prisma.PermitterWhereInput[])];
      }
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      where.eventDate = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    if (status) {
      where.status = status;
    }

    const orderBy: Prisma.PermitterOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const include = {
      permitter: { select: { id: true, name: true } },
      spg: { select: { id: true, name: true } },
      venue: {
        select: {
          id: true,
          name: true,
          regionId: true,
          region: { select: { name: true } },
        },
      },
      schools: {
        orderBy: { order: "asc" as const },
      },
    } satisfies Prisma.PermitterInclude;

    const [permitters, total] = await Promise.all([
      prisma.permitter.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include,
      }),
      prisma.permitter.count({ where }),
    ]);

    return { permitters, total };
  },

  async findById(id: string) {
    return prisma.permitter.findUnique({
      where: { id },
      include: {
        permitter: { select: { id: true, name: true } },
        spg: { select: { id: true, name: true } },
        venue: {
          select: {
            id: true,
            name: true,
            regionId: true,
            region: { select: { name: true } },
          },
        },
        schools: {
          orderBy: { order: "asc" },
        },
      },
    });
  },

  async findConflicting(venueId: string, date: Date, excludeId?: string) {
    const where: Prisma.PermitterWhereInput = {
      venueId,
      eventDate: {
        gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
        lte: new Date(new Date(date).setHours(23, 59, 59, 999)),
      },
    };
    if (excludeId) {
      where.id = { not: excludeId };
    }
    return prisma.permitter.findFirst({ where });
  },

  async createInTransaction(data: CreatePermitterInput) {
    return prisma.$transaction(async (tx) => {
      const permitter = await tx.permitter.create({
        data: {
          permitterId: data.permitterId,
          spgId: data.spgId,
          venueId: data.venueId,
          eventDate: data.eventDate,
          status: data.status ?? "active",
          schools: {
            create: data.schools.map((school, index) => ({
              name: school.name,
              schoolAddress: school.schoolAddress,
              totalStudents: school.totalStudents,
              picName: school.picName,
              picPhone: school.picPhone,
              order: index + 1,
            })),
          },
        },
        include: {
          permitter: { select: { id: true, name: true } },
          spg: { select: { id: true, name: true } },
          venue: {
            select: {
              id: true,
              name: true,
              regionId: true,
              region: { select: { name: true } },
            },
          },
          schools: {
            orderBy: { order: "asc" },
          },
        },
      });
      return permitter;
    });
  },

  async updateInTransaction(id: string, data: UpdatePermitterInput) {
    return prisma.$transaction(async (tx) => {
      // Update permitter fields (excluding schools)
      const { schools, ...permitterData } = data;

      const permitter = await tx.permitter.update({
        where: { id },
        data: permitterData,
        include: {
          permitter: { select: { id: true, name: true } },
          spg: { select: { id: true, name: true } },
          venue: {
            select: {
              id: true,
              name: true,
              regionId: true,
              region: { select: { name: true } },
            },
          },
          schools: {
            orderBy: { order: "asc" },
          },
        },
      });

      // If schools are provided, replace all existing schools
      if (schools) {
        await tx.permitterSchool.deleteMany({ where: { permitterId: id } });

        await tx.permitterSchool.createMany({
          data: schools.map((school, index) => ({
            permitterId: id,
            name: school.name,
            schoolAddress: school.schoolAddress,
            totalStudents: school.totalStudents,
            picName: school.picName,
            picPhone: school.picPhone,
            order: index + 1,
          })),
        });

        // Re-fetch with updated schools
        return tx.permitter.findUnique({
          where: { id },
          include: {
            permitter: { select: { id: true, name: true } },
            spg: { select: { id: true, name: true } },
            venue: {
              select: {
                id: true,
                name: true,
                regionId: true,
                region: { select: { name: true } },
              },
            },
            schools: {
              orderBy: { order: "asc" },
            },
          },
        });
      }

      return permitter;
    });
  },

  async delete(id: string) {
    return prisma.permitter.delete({ where: { id } });
  },

  async verifyVenueExists(venueId: string) {
    return prisma.venue.findUnique({ where: { id: venueId }, select: { id: true } });
  },

  async verifyUserExists(userId: string) {
    return prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true } });
  },
};
