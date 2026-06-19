/**
 * Derived tier helpers for the seat-selection UI. Pure reads of hall-config —
 * which tiers a zone contains, the canonical display order, and a zone's
 * "from" price given a show's per-tier prices.
 */
import { HALL_CONFIG, type TierId } from "./hall-config";

/** Canonical legend/display order. */
export const TIER_ORDER: TierId[] = [
  "premium",
  "standard",
  "economy",
  "balcony",
];

/** Distinct tiers present in one zone, in canonical order. */
export function zoneTiers(zoneId: string): TierId[] {
  const zone = HALL_CONFIG.find((z) => z.id === zoneId);
  if (!zone) return [];
  const present = new Set(zone.rows.map((r) => r.tier));
  return TIER_ORDER.filter((t) => present.has(t));
}

/** Distinct tiers present anywhere in the hall, in canonical order. */
export function allHallTiers(): TierId[] {
  const present = new Set<TierId>();
  for (const zone of HALL_CONFIG) {
    for (const row of zone.rows) present.add(row.tier);
  }
  return TIER_ORDER.filter((t) => present.has(t));
}

/** Cheapest tier price within a zone, for the "от X ₸" subtitle. */
export function zoneMinPrice(
  zoneId: string,
  prices: Record<TierId, number>,
): number {
  const zone = HALL_CONFIG.find((z) => z.id === zoneId);
  if (!zone) return 0;
  return Math.min(...zone.rows.map((r) => prices[r.tier]));
}
