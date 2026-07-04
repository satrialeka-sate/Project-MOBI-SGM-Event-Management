import { prisma } from "@/lib/prisma";
import type { SchedulePermitter, ScheduleQueryParams } from "@/types/schedule";

export const scheduleRepository = {
  async findPermittersByMonth(params: ScheduleQueryParams): Promise<SchedulePermitter[]> {
    const { month, year, regionId, cycle } = params;

    // Build date range for the entire month
    const startDate = new Date(year, month - 1, 1); // month is 1-indexed
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(year, month, 0); // last day of the month
    endDate.setHours(23, 59, 59, 999);

    const where: Record<string, unknown> = {
      eventDate: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (regionId) {
      where.regionId = regionId;
    }

    if (cycle) {
      where.cycle = cycle;
    }

    const permitters = await prisma.permitter.findMany({
      where: where as any,
      select: {
        id: true,
        eventDate: true,
        venueName: true,
        venueAddress: true,
        cycle: true,
        region: {
          select: { name: true },
        },
      },
      orderBy: { eventDate: "asc" },
    });

    return permitters.map((p) => ({
      id: p.id,
      eventDate: p.eventDate.toISOString(),
      venueName: p.venueName,
      venueAddress: p.venueAddress,
      regionName: p.region.name,
      cycle: p.cycle,
    }));
  },

  async findDistinctCycles(): Promise<string[]> {
    const results = await prisma.permitter.findMany({
      select: { cycle: true },
      distinct: ["cycle"],
      orderBy: { cycle: "asc" },
    });
    return results.map((r) => r.cycle).filter(Boolean);
  },
};
