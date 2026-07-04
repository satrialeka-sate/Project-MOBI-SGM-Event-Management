import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

interface FindAllParams {
  eventId: string;
  page?: number;
  limit?: number;
}

interface FindAllResult {
  contacts: Array<{
    id: string;
    eventId: string;
    contactDate: Date;
    totalContact: number;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
  total: number;
}

export const contactRepository = {
  async findByEventId(params: FindAllParams): Promise<FindAllResult> {
    const { eventId, page = 1, limit = 10 } = params;

    const where: Prisma.ContactWhereInput = { eventId };

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        orderBy: { contactDate: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.contact.count({ where }),
    ]);

    return { contacts, total };
  },

  async findById(id: string) {
    return prisma.contact.findUnique({
      where: { id },
    });
  },

  async create(data: {
    eventId: string;
    totalContact: number;
    createdBy: string;
    contactDate?: Date;
  }) {
    return prisma.contact.create({
      data: {
        eventId: data.eventId,
        totalContact: data.totalContact,
        createdBy: data.createdBy,
        contactDate: data.contactDate ?? new Date(),
      },
    });
  },

  async update(id: string, data: {
    totalContact?: number;
    contactDate?: Date;
  }) {
    return prisma.contact.update({
      where: { id },
      data,
    });
  },

  async delete(id: string) {
    return prisma.contact.delete({ where: { id } });
  },
};
