import { prisma } from "@/lib/prisma";
import type { Prisma, $Enums } from "../generated/prisma/client";

const sellingInclude = {
  product: { select: { id: true, productName: true, package: true, price: true, gimmick: true } },
} satisfies Prisma.SellingInclude;

interface FindAllParams {
  eventId: string;
  page?: number;
  limit?: number;
}

interface FindAllResult {
  sellings: Array<{
    id: string;
    eventId: string;
    sellingDate: Date;
    previousMilk: $Enums.PreviousMilk;
    productId: string;
    productName: string;
    gimmick: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    product: { id: string; productName: string; package: string; price: number; gimmick: string };
  }>;
  total: number;
}

export const sellingRepository = {
  async findByEventId(params: FindAllParams): Promise<FindAllResult> {
    const { eventId, page = 1, limit = 10 } = params;

    const where: Prisma.SellingWhereInput = { eventId };

    const [sellings, total] = await Promise.all([
      prisma.selling.findMany({
        where,
        orderBy: { sellingDate: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: sellingInclude,
      }),
      prisma.selling.count({ where }),
    ]);

    return { sellings, total };
  },

  async findById(id: string) {
    return prisma.selling.findUnique({
      where: { id },
      include: sellingInclude,
    });
  },

  async create(data: {
    eventId: string;
    previousMilk: $Enums.PreviousMilk;
    productId: string;
    productName: string;
    gimmick: string;
    createdBy: string;
    sellingDate?: Date;
  }) {
    return prisma.selling.create({
      data: {
        eventId: data.eventId,
        previousMilk: data.previousMilk,
        productId: data.productId,
        productName: data.productName,
        gimmick: data.gimmick,
        createdBy: data.createdBy,
        sellingDate: data.sellingDate ?? new Date(),
      },
      include: sellingInclude,
    });
  },

  async update(id: string, data: {
    previousMilk?: $Enums.PreviousMilk;
    productId?: string;
    productName?: string;
    gimmick?: string;
    sellingDate?: Date;
  }) {
    return prisma.selling.update({
      where: { id },
      data,
      include: sellingInclude,
    });
  },

  async delete(id: string) {
    return prisma.selling.delete({ where: { id } });
  },
};
