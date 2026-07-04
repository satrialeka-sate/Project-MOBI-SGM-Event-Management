import { dashboardRepository } from "@/repositories/dashboard.repository";
import type { TodayEventResponse } from "@/types/dashboard";

export const dashboardService = {
  /**
   * Get today's event assignment for the logged-in SPG.
   *
   * Business rules:
   * - Only SPG role is allowed (checked by caller via requirePermission)
   * - Search by current logged-in user (spgId)
   * - Match eventDate = today
   * - If no assignment exists, return null (NOT a 404 error)
   */
  async getTodayEvent(spgId: string): Promise<TodayEventResponse | null> {
    const permitter = await dashboardRepository.findTodayBySpg(spgId);

    if (!permitter) {
      return null;
    }

    return {
      id: permitter.id,
      eventId: permitter.event?.id ?? null,
      eventDate: permitter.eventDate,
      status: "ONGOING",
      region: permitter.region.name,
      cycle: permitter.cycle,
      venue: {
        name: permitter.venueName,
        address: permitter.venueAddress,
        pic: permitter.venuePIC,
      },
      spg: permitter.spg
        ? {
            id: permitter.spg.id,
            name: permitter.spg.name,
            email: permitter.spg.email,
          }
        : null,
      schools: permitter.schools.map((s) => ({
        name: s.name,
        address: s.schoolAddress,
        totalStudents: s.totalStudents,
        picName: s.picName,
        picPhone: s.picPhone,
      })),
    };
  },
};
