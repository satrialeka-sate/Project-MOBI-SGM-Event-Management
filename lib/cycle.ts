export interface CycleConfig {
  name: string;
  start: { month: number; day: number };
  end: { month: number; day: number };
}

/**
 * Cycle period configuration.
 *
 * To change cycle periods in future years, simply update this array.
 * Months are 1-indexed (1 = January, 2 = February, etc.).
 * Start and end dates are inclusive.
 */
const CYCLES: CycleConfig[] = [
  {
    name: "Cycle 1",
    start: { month: 5, day: 11 },
    end: { month: 6, day: 11 },
  },
  {
    name: "Cycle 2",
    start: { month: 7, day: 20 },
    end: { month: 8, day: 15 },
  },
  {
    name: "Cycle 3",
    start: { month: 8, day: 26 },
    end: { month: 9, day: 21 },
  },
];

/**
 * Determines the cycle for a given date using UTC date values.
 *
 * Builds Date objects using the event's year so the comparison works
 * automatically in any year without hardcoding specific years.
 * Uses UTC for all date operations to prevent timezone shifts.
 *
 * @param date - The date to evaluate (expected to be UTC midnight from ISO date parsing)
 * @returns The cycle name (e.g. "Cycle 1") if within a period, or null if outside all periods
 *
 * @example
 * getCycleFromDate(new Date("2026-05-15")) // "Cycle 1"
 * getCycleFromDate(new Date("2026-08-14")) // "Cycle 2"
 * getCycleFromDate(new Date("2026-10-01")) // null
 */
export function getCycleFromDate(date: Date): string | null {
  const year = date.getUTCFullYear();

  for (const cycle of CYCLES) {
    // Build start/end Date objects using UTC to match eventDate which is UTC midnight
    // Months are 0-indexed in Date.UTC(), so subtract 1
    // End date includes the full day (23:59:59.999 UTC) for inclusive end boundary
    const startDate = new Date(Date.UTC(year, cycle.start.month - 1, cycle.start.day));
    const endDate = new Date(Date.UTC(year, cycle.end.month - 1, cycle.end.day, 23, 59, 59, 999));

    if (date >= startDate && date <= endDate) {
      return cycle.name;
    }
  }

  return null;
}

export { CYCLES };
