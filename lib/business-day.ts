/**
 * Business day validation helper.
 *
 * Currently validates that a date falls on Monday–Friday.
 * Designed to be extended with holiday checks (national holidays,
 * company holidays, collective leave) without changing the service layer.
 *
 * Usage:
 *   isBusinessDay(date)        → true / false
 *   getBusinessDayError(date)  → Error message string | null
 */

const BUSINESS_DAY_MESSAGE =
  "Event hanya dapat dijadwalkan pada hari Senin sampai Sabtu.";

/**
 * Returns true if the date is a business day (Monday–Saturday).
 * Extend this function with holiday calendar checks as needed.
 */
export function isBusinessDay(date: Date): boolean {
  const day = date.getDay();
  // 0 = Sunday, 1-6 = Monday-Saturday
  return day >= 1 && day <= 6;
}

/**
 * Returns the business-day error message if the date is NOT a business day,
 * or null if it is a valid business day.
 *
 * Convenience wrapper so callers don't need to hardcode the message.
 */
export function getBusinessDayErrorMessage(date: Date): string | null {
  if (!isBusinessDay(date)) {
    return BUSINESS_DAY_MESSAGE;
  }
  return null;
}
