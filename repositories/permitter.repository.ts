import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { CreatePermitterInput, UpdatePermitterInput, PermitterQueryParams } from "@/types/permitter";

const permitterInclude = {
  permitter: { select: { id: true, name: true, regionId: true } },
  region: { select: { id: true, name: true } },
  schools: {
    orderBy: { order: "asc" as const },
  },
} satisfies Prisma.PermitterInclude;

type PermitterWithRelations = Prisma.PermitterGetPayload<{ include: typeof permitterInclude }>;

interface FindAllResult {
  permitters: PermitterWithRelations[];
  total: number;
}

export const permitterRepository = {
  async findAll(params: PermitterQueryParams): Promise<FindAllResult> {
    const { page = 1, limit = 10, search, regionId, userId, date, status, sortBy = "eventDate", sortOrder = "desc" } = params;

    const where: Prisma.PermitterWhereInput = {};

    if (search) {
      where.OR = [
        { venueName: { contains: search, mode: "insensitive" } },
        { venueAddress: { contains: search, mode: "insensitive" } },
        { venuePIC: { contains: search, mode: "insensitive" } },
        { permitter: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (regionId) {
      where.regionId = regionId;
    }

    if (userId) {
      const userFilter: Prisma.PermitterWhereInput = {
        permitterId: userId,
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

    const [permitters, total] = await Promise.all([
      prisma.permitter.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: permitterInclude,
      }),
      prisma.permitter.count({ where }),
    ]);

    return { permitters, total };
  },

  async findById(id: string) {
    return prisma.permitter.findUnique({
      where: { id },
      include: permitterInclude,
    });
  },



  async createInTransaction(data: CreatePermitterInput) {
    return prisma.$transaction(async (tx) => {
      const permitter = await tx.permitter.create({
        data: {
          permitterId: data.permitterId,
          regionId: data.regionId,
          cycle: data.cycle,
          venueName: data.venueName,
          venueAddress: data.venueAddress,
          venuePIC: data.venuePIC,
          venuePICPhone: data.venuePICPhone,
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
        include: permitterInclude,
      });
      return permitter;
    });
  },

  async updateInTransaction(id: string, data: UpdatePermitterInput) {
    return prisma.$transaction(async (tx) => {
      const { schools, ...permitterData } = data;

      const permitter = await tx.permitter.update({
        where: { id },
        data: permitterData,
        include: permitterInclude,
      });

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

        return tx.permitter.findUniqueOrThrow({
          where: { id },
          include: permitterInclude,
        });
      }

      return permitter;
    });
  },

  async delete(id: string) {
    return prisma.permitter.delete({ where: { id } });
  },

  async verifyRegionExists(regionId: string) {
    return prisma.region.findUnique({
      where: { id: regionId },
      select: { id: true, name: true },
    });
  },

  async verifyUserExists(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, regionId: true, role: true },
    });
  },
};
