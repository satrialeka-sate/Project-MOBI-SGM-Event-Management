/**
 * Constants for region business rules.
 *
 * This file is the single source of truth for which regions are:
 * - OPERATIONAL: can be selected by users (JABAR, JATENG, JATIM)
 * - LEGACY: exists in the database but is no longer selectable (STARLIGHT)
 *
 * All backend validation against region names MUST use these constants.
 * The seed/prisma data still creates all regions including LEGACY ones
 * so that existing database references do not break.
 */

/** Regions that users can actively select (ADMIN PO dropdown, etc.) */
export const OPERATIONAL_REGIONS = new Set(["JABAR", "JATENG", "JATIM"]);

/** Regions that exist in the database as master data but are NOT selectable */
export const LEGACY_REGIONS = new Set(["STARLIGHT"]);

/** All known region names (operational + legacy) */
export const ALL_REGIONS = new Set([...OPERATIONAL_REGIONS, ...LEGACY_REGIONS]);

/**
 * Returns true if the given region name is an operational region
 * that users can actively select.
 */
export function isOperationalRegion(name: string): boolean {
  return OPERATIONAL_REGIONS.has(name);
}

/**
 * Returns true if the given region name is a legacy region that
 * exists in the database but cannot be selected by users.
 */
export function isLegacyRegion(name: string): boolean {
  return LEGACY_REGIONS.has(name);
}

/**
 * Returns an array of operational region names (for UI display, dropdowns, etc.)
 */
export function getOperationalRegionNames(): string[] {
  return [...OPERATIONAL_REGIONS].sort();
}

/**
 * Build a Prisma-compatible `name` filter that excludes all legacy regions.
 *
 * Example usage in Prisma findMany/findFirst:
 * ```ts
 * where: {
 *   name: excludeLegacyRegionsFilter(),
 * }
 * ```
 */
export function excludeLegacyRegionsFilter(): { not: { in: string[] } } {
  return {
    not: { in: [...LEGACY_REGIONS] },
  };
}
