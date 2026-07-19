import { prisma } from "@/lib/prisma";
import type { SurveyQueryParams } from "@/types/survey";

interface ReportQueryParams {
  eventId?: string;
  regionId?: string;
  startDate?: string;
  endDate?: string;
}


const surveyInclude = {
  event: { select: { id: true, venueName: true } },
  region: { select: { id: true, name: true } },
  user: { select: { id: true, name: true } },
} as const;



export const surveyRepository = {
  async findAll(params: SurveyQueryParams & { regionId?: string; createdBy?: string }) {
    const { page = 1, limit = 10, eventId, regionId, createdBy, startDate, endDate } = params;

    const where: Record<string, unknown> = {};

    if (eventId) where.eventId = eventId;
    if (regionId) where.regionId = regionId;
    if (createdBy) where.createdBy = createdBy;

    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate) {
        dateFilter.gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.lte = new Date(endDate + "T23:59:59.999Z");
      }
      where.surveyDate = dateFilter;
    }

    const [surveys, total] = await Promise.all([
      prisma.survey.findMany({
        where,
        include: surveyInclude,
        orderBy: { surveyDate: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.survey.count({ where }),
    ]);

    return { surveys, total };
  },

  async findById(id: string) {
    return prisma.survey.findUnique({
      where: { id },
      include: surveyInclude,
    });
  },

  async findByEventId(eventId: string) {
    return prisma.survey.findMany({
      where: { eventId },
      include: surveyInclude,
      orderBy: { surveyDate: "desc" },
    });
  },

  async create(data: {
    eventId: string;
    regionId: string;
    createdBy: string;
    profession: string;
    notBuyingReason: string;
    buyingReason: string;
    package: string;
    favoriteActivity: string;
    memorableImpression: string;
    crewImpression: string;
  }) {
    return prisma.survey.create({
      data: {
        eventId: data.eventId,
        regionId: data.regionId,
        createdBy: data.createdBy,
        profession: data.profession as any,
        notBuyingReason: data.notBuyingReason as any,
        buyingReason: data.buyingReason as any,
        package: data.package as any,
        favoriteActivity: data.favoriteActivity as any,
        memorableImpression: data.memorableImpression as any,
        crewImpression: data.crewImpression as any,
      },
      include: surveyInclude,
    });
  },

  async deleteById(id: string) {
    return prisma.survey.delete({
      where: { id },
    });
  },

  async getReportStats(params: ReportQueryParams & { regionId?: string }) {
    const where: Record<string, unknown> = {};

    if (params.eventId) where.eventId = params.eventId;
    if (params.regionId) where.regionId = params.regionId;
    if (params.startDate || params.endDate) {
      const dateFilter: Record<string, Date> = {};
      if (params.startDate) {
        dateFilter.gte = new Date(params.startDate);
      }
      if (params.endDate) {
        dateFilter.lte = new Date(params.endDate + "T23:59:59.999Z");
      }
      where.surveyDate = dateFilter;
    }

    return prisma.survey.findMany({
      where,
      include: surveyInclude,
      orderBy: { surveyDate: "desc" },
    });
  },
};
