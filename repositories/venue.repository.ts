import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { CreateVenueInput, UpdateVenueInput, VenueQueryParams } from "@/types/venue";

interface FindAllResult {
  venues: Array<{
    id: string;
    name: string;
    kota: string;
    alamat: string;
    picVenue: string;
    regionId: string;
    createdAt: Date;
    updatedAt: Date;
    region: { name: string };
  }>;
  total: number;
}

export const venueRepository = {
  async findAll(params: VenueQueryParams): Promise<FindAllResult> {
    const { page = 1, limit = 10, search, regionId, sortBy = "createdAt", sortOrder = "desc" } = params;

    const where: Prisma.VenueWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { kota: { contains: search, mode: "insensitive" } },
        { alamat: { contains: search, mode: "insensitive" } },
        { picVenue: { contains: search, mode: "insensitive" } },
      ];
    }

    if (regionId) {
      where.regionId = regionId;
    }

    const orderBy: Prisma.VenueOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [venues, total] = await Promise.all([
      prisma.venue.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          region: { select: { name: true } },
        },
      }),
      prisma.venue.count({ where }),
    ]);

    return { venues, total };
  },

  async findById(id: string) {
    return prisma.venue.findUnique({
      where: { id },
      include: {
        region: { select: { name: true } },
      },
    });
  },

  async findByNameAndRegion(name: string, regionId: string) {
    return prisma.venue.findUnique({
      where: { name_regionId: { name, regionId } },
    });
  },

  async create(data: CreateVenueInput) {
    return prisma.venue.create({
      data,
      include: {
        region: { select: { name: true } },
      },
    });
  },

  async update(id: string, data: UpdateVenueInput) {
    return prisma.venue.update({
      where: { id },
      data,
      include: {
        region: { select: { name: true } },
      },
    });
  },

  async delete(id: string) {
    return prisma.venue.delete({ where: { id } });
  },
};
