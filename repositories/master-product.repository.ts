import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { MasterProductQueryParams } from "@/types/master-product";

interface FindAllResult {
  products: Array<{
    id: string;
    productName: string;
    price: number;
    package: string;
    gimmick: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
  total: number;
}

export const masterProductRepository = {
  async findAll(params: MasterProductQueryParams): Promise<FindAllResult> {
    const {
      page = 1,
      limit = 20,
      search,
      sortBy = "productName",
      sortOrder = "asc",
    } = params;

    const where: Prisma.MasterProductWhereInput = {};

    if (search) {
      where.OR = [
        { productName: { contains: search, mode: "insensitive" } },
        { gimmick: { contains: search, mode: "insensitive" } },
      ];
    }

    const orderBy: Prisma.MasterProductOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [products, total] = await Promise.all([
      prisma.masterProduct.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.masterProduct.count({ where }),
    ]);

    return { products, total };
  },

  async findById(id: string) {
    return prisma.masterProduct.findUnique({ where: { id } });
  },

  async findByProductName(productName: string) {
    return prisma.masterProduct.findUnique({ where: { productName } });
  },

  async findAllForSearch(search?: string) {
    const where: Prisma.MasterProductWhereInput = {};
    if (search) {
      where.productName = { contains: search, mode: "insensitive" };
    }
    return prisma.masterProduct.findMany({
      where,
      orderBy: { productName: "asc" },
      take: 50,
    });
  },

  async create(data: { productName: string; price: number; gimmick: string }) {
    return prisma.masterProduct.create({ data });
  },

  async createMany(data: Array<{ productName: string; price: number; gimmick: string }>) {
    return prisma.masterProduct.createMany({ data, skipDuplicates: true });
  },

  async update(id: string, data: { productName?: string; price?: number; gimmick?: string }) {
    return prisma.masterProduct.update({
      where: { id },
      data,
    });
  },

  async delete(id: string) {
    return prisma.masterProduct.delete({ where: { id } });
  },
};
