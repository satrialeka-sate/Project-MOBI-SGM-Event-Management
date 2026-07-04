import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const dashboardInclude = {
  event: { select: { id: true } },
  region: { select: { name: true } },
  spg: { select: { id: true, name: true, email: true } },
  schools: {
    orderBy: { order: "asc" as const },
    select: {
      name: true,
      schoolAddress: true,
      totalStudents: true,
      picName: true,
      picPhone: true,
    },
  },
} satisfies Prisma.PermitterInclude;

type DashboardPermitter = Prisma.PermitterGetPayload<{
  include: typeof dashboardInclude;
}>;

export type DashboardResult = DashboardPermitter;

export const dashboardRepository = {
  /**
   * Find today's assignment for a given SPG user.
   * Fetches the Permitter (planning) record that matches:
   * - assigned SPG = spgId
   * - eventDate = today
   *
   * Returns null if no assignment exists for today.
   */
  async findTodayBySpg(spgId: string): Promise<DashboardResult | null> {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    return prisma.permitter.findFirst({
      where: {
        spgId,
        eventDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: dashboardInclude,
    });
  },
};
