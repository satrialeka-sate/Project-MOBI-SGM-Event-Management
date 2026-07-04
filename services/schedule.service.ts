import { scheduleRepository } from "@/repositories/schedule.repository";
import type { ActorContext } from "@/types/auth";
import type { ScheduleDay, ScheduleQueryParams, ScheduleResponse } from "@/types/schedule";
import { isGlobalScope } from "@/lib/scope";
import { AppError } from "@/lib/errors";

const MONTH_NAMES_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function isWeekend(dayOfWeek: number): boolean {
  return dayOfWeek === 0 || dayOfWeek === 6; // Sunday=0, Saturday=6
}

export const scheduleService = {
  async getMonthlySchedule(
    actor: ActorContext,
    params: ScheduleQueryParams
  ): Promise<ScheduleResponse> {
    const { month, year, regionId, cycle } = params;

    if (month < 1 || month > 12) {
      throw new AppError("Invalid month. Must be between 1 and 12", 400);
    }
    if (year < 2000 || year > 2100) {
      throw new AppError("Invalid year", 400);
    }

    // Apply scope-based region filter
    const effectiveRegionId = !isGlobalScope(actor.scope) ? actor.regionId : (regionId || undefined);

    // Fetch permitters for the month
    const permitters = await scheduleRepository.findPermittersByMonth({
      month,
      year,
      regionId: effectiveRegionId,
      cycle,
    });

    // Build schedule days for the entire month
    const totalDays = new Date(year, month, 0).getDate(); // Last day of month
    const days: ScheduleDay[] = [];

    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(year, month - 1, day);
      const dayOfWeek = date.getDay();

      // Filter permitters for this specific date
      const dayPermitters = permitters.filter((p) => {
        const pDate = new Date(p.eventDate);
        return pDate.getDate() === day &&
               pDate.getMonth() === month - 1 &&
               pDate.getFullYear() === year;
      });

      days.push({
        date: day,
        dayOfWeek,
        isWeekend: isWeekend(dayOfWeek),
        permitters: dayPermitters,
      });
    }

    return {
      month,
      year,
      monthName: MONTH_NAMES_ID[month - 1],
      days,
      totalDays,
      cycle,
    };
  },

  async getCycles(actor: ActorContext): Promise<string[]> {
    return scheduleRepository.findDistinctCycles();
  },
};
