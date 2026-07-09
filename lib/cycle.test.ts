import { describe, it, expect } from "vitest";
import { getCycleFromDate, CYCLES } from "./cycle";

describe("getCycleFromDate", () => {
  describe("Cycle 1 (May 11 – June 11)", () => {
    it("returns Cycle 1 for the start date (May 11)", () => {
      expect(getCycleFromDate(new Date("2026-05-11"))).toBe("Cycle 1");
    });

    it("returns Cycle 1 for a date within the period (May 15)", () => {
      expect(getCycleFromDate(new Date("2026-05-15"))).toBe("Cycle 1");
    });

    it("returns Cycle 1 for the end date (June 11)", () => {
      expect(getCycleFromDate(new Date("2026-06-11"))).toBe("Cycle 1");
    });

    it("returns null for the day after Cycle 1 ends (June 12)", () => {
      expect(getCycleFromDate(new Date("2026-06-12"))).toBeNull();
    });
  });

  describe("Cycle 2 (July 20 – August 15)", () => {
    it("returns Cycle 2 for the start date (July 20)", () => {
      expect(getCycleFromDate(new Date("2026-07-20"))).toBe("Cycle 2");
    });

    it("returns Cycle 2 for a date within the period (July 25)", () => {
      expect(getCycleFromDate(new Date("2026-07-25"))).toBe("Cycle 2");
    });

    it("returns Cycle 2 for the end date (August 15)", () => {
      expect(getCycleFromDate(new Date("2026-08-15"))).toBe("Cycle 2");
    });

    it("returns null for the day after Cycle 2 ends (August 16)", () => {
      expect(getCycleFromDate(new Date("2026-08-16"))).toBeNull();
    });
  });

  describe("Cycle 3 (August 26 – September 21)", () => {
    it("returns Cycle 3 for the start date (August 26)", () => {
      expect(getCycleFromDate(new Date("2026-08-26"))).toBe("Cycle 3");
    });

    it("returns Cycle 3 for a date within the period (September 10)", () => {
      expect(getCycleFromDate(new Date("2026-09-10"))).toBe("Cycle 3");
    });

    it("returns Cycle 3 for the end date (September 21)", () => {
      expect(getCycleFromDate(new Date("2026-09-21"))).toBe("Cycle 3");
    });

    it("returns null for the day after Cycle 3 ends (September 22)", () => {
      expect(getCycleFromDate(new Date("2026-09-22"))).toBeNull();
    });
  });

  describe("Outside all cycles", () => {
    it("returns null for dates between Cycle 1 and Cycle 2 (June 20)", () => {
      expect(getCycleFromDate(new Date("2026-06-20"))).toBeNull();
    });

    it("returns null for dates between Cycle 1 and Cycle 2 (July 10)", () => {
      expect(getCycleFromDate(new Date("2026-07-10"))).toBeNull();
    });

    it("returns null for dates after Cycle 3 (October 1)", () => {
      expect(getCycleFromDate(new Date("2026-10-01"))).toBeNull();
    });

    it("returns null for dates before Cycle 1 (May 1)", () => {
      expect(getCycleFromDate(new Date("2026-05-01"))).toBeNull();
    });
  });

  describe("Different years (year-agnostic)", () => {
    it("works correctly for 2025", () => {
      expect(getCycleFromDate(new Date("2025-05-15"))).toBe("Cycle 1");
      expect(getCycleFromDate(new Date("2025-07-25"))).toBe("Cycle 2");
      expect(getCycleFromDate(new Date("2025-09-10"))).toBe("Cycle 3");
    });

    it("works correctly for 2027", () => {
      expect(getCycleFromDate(new Date("2027-05-15"))).toBe("Cycle 1");
      expect(getCycleFromDate(new Date("2027-07-25"))).toBe("Cycle 2");
      expect(getCycleFromDate(new Date("2027-09-10"))).toBe("Cycle 3");
    });

    it("works correctly for a leap year (2028)", () => {
      expect(getCycleFromDate(new Date("2028-05-11"))).toBe("Cycle 1");
      expect(getCycleFromDate(new Date("2028-08-26"))).toBe("Cycle 3");
    });
  });

  describe("Timezone safety", () => {
    it("handles dates near midnight correctly", () => {
      // ISO date string without time is parsed as UTC midnight
      // The helper should extract the correct month/day
      const date = new Date("2026-06-11T00:00:00.000Z");
      expect(getCycleFromDate(date)).toBe("Cycle 1");
    });

    it("treats end of day as still within the cycle", () => {
      // 23:59:59 on June 11 should still be Cycle 1
      const date = new Date("2026-06-11T23:59:59.999Z");
      expect(getCycleFromDate(date)).toBe("Cycle 1");
    });

    it("correctly identifies the first moment outside a cycle", () => {
      // Just past midnight on June 12 should NOT be Cycle 1
      const date = new Date("2026-06-12T00:00:00.000Z");
      expect(getCycleFromDate(date)).toBeNull();
    });
  });

  describe("CYCLES configuration", () => {
    it("has exactly 3 cycles defined", () => {
      expect(CYCLES).toHaveLength(3);
    });

    it("each cycle has a name, start, and end with month and day", () => {
      for (const cycle of CYCLES) {
        expect(cycle.name).toBeDefined();
        expect(cycle.start.month).toBeGreaterThanOrEqual(1);
        expect(cycle.start.month).toBeLessThanOrEqual(12);
        expect(cycle.start.day).toBeGreaterThanOrEqual(1);
        expect(cycle.start.day).toBeLessThanOrEqual(31);
        expect(cycle.end.month).toBeGreaterThanOrEqual(1);
        expect(cycle.end.month).toBeLessThanOrEqual(12);
        expect(cycle.end.day).toBeGreaterThanOrEqual(1);
        expect(cycle.end.day).toBeLessThanOrEqual(31);
      }
    });
  });
});
