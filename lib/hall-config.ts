/**
 * hall-config.ts
 *
 * Source of truth for the physical structure of the
 * State Republican Uyghur Musical Comedy Theater (Almaty).
 *
 * WHAT'S HERE (immutable, lives in code):
 *   - Zones, rows, seat counts per row
 *   - Tier assignment per row (which physical area is "premium" etc.)
 *   - Default tier prices, colors, labels
 *
 * WHAT'S NOT HERE (per-event, configured via admin panel, stored in DB):
 *   - Actual prices per event (admin can override DEFAULT_TIER_PRICES)
 *   - Per-seat availability (sold / blocked / VIP hold)
 *   - Special event setups (closed sections, premiere-only zones)
 *
 * Total seats: ~365 (verify with TOTAL_SEATS constant after generation)
 */

// ============================================================
// TIERS — price categories that map zones/rows to a price
// ============================================================

export type TierId = "premium" | "standard" | "economy" | "balcony";

/** Default prices. Admin overrides these per-event in DB. */
export const DEFAULT_TIER_PRICES: Record<TierId, number> = {
  premium: 4000,   // green  — Амфитеатр ряды 5–7 (best view, elevated front)
  standard: 3500,  // blue   — Амфитеатр ряды 8–10
  economy: 3000,   // pink   — Партер (все) + Амфитеатр ряды 11–13
  balcony: 2500,   // teal   — Балкон + все боковые ярусы
};

export const TIER_COLORS: Record<TierId, string> = {
  premium: "#4ADE80",
  standard: "#60A5FA",
  economy: "#F472B6",
  balcony: "#7BA9A8",
};

export const TIER_LABELS: Record<TierId, Record<Locale, string>> = {
  premium: { kz: "Премиум", ru: "Премиум", ug: "Премиум" },
  standard: { kz: "Стандарт", ru: "Стандарт", ug: "Стандарт" },
  economy: { kz: "Эконом", ru: "Эконом", ug: "Эконом" },
  balcony: { kz: "Балкон", ru: "Балкон", ug: "Балкон" },
};

// ============================================================
// HALL STRUCTURE — zones → rows → seats
// ============================================================

export type Locale = "kz" | "ru" | "ug";

export type Row = {
  /** Row number as printed on tickets (1, 2, ..., 13). */
  number: number;
  /** Total seats in this row. Seat numbers run 1..seatCount. */
  seatCount: number;
  /** Default price tier for this row. */
  tier: TierId;
};

export type Zone = {
  /** Stable machine ID (used in DB, URLs, seat IDs). */
  id: string;
  /** Display name in 3 languages. */
  name: Record<Locale, string>;
  /** Rows in this zone (any number, any seat counts). */
  rows: Row[];
};

export const HALL_CONFIG: Zone[] = [
  // ──────────────────── ПАРТЕР ────────────────────
  // Ground level, in front of stage. Single tier (economy/pink).
  // Note: rows fan out — back rows wider than front.
  {
    id: "parter",
    name: { kz: "Партер", ru: "Партер", ug: "Партер" },
    rows: [
      { number: 1, seatCount: 19, tier: "economy" },
      { number: 2, seatCount: 21, tier: "economy" },
      { number: 3, seatCount: 23, tier: "economy" },
      { number: 4, seatCount: 24, tier: "economy" },
    ],
  },

  // ──────────────────── АМФИТЕАТР ────────────────────
  // Elevated, behind parter. Mixed tiers (front=premium, mid=standard, back=economy).
  // Rows numbered 5–13 (continuous with parter? or separate? — keep as-is per Ticketon).
  {
    id: "amphitheater",
    name: { kz: "Амфитеатр", ru: "Амфитеатр", ug: "Амфитеатр" },
    rows: [
      { number: 5,  seatCount: 20, tier: "premium" },  // green
      { number: 6,  seatCount: 21, tier: "premium" },
      { number: 7,  seatCount: 22, tier: "premium" },
      { number: 8,  seatCount: 22, tier: "standard" }, // blue
      { number: 9,  seatCount: 22, tier: "standard" },
      { number: 10, seatCount: 22, tier: "standard" },
      { number: 11, seatCount: 22, tier: "economy" },  // pink
      { number: 12, seatCount: 22, tier: "economy" },
      { number: 13, seatCount: 23, tier: "economy" },
    ],
  },

  // ──────────────────── БАЛКОН ────────────────────
  // Upper level, rear of hall. All balcony tier.
  // Front row is full-width; back rows have center aisle (still continuous numbering).
  {
    id: "balcony",
    name: { kz: "Балкон", ru: "Балкон", ug: "Балкон" },
    rows: [
      { number: 1, seatCount: 22, tier: "balcony" },
      { number: 2, seatCount: 15, tier: "balcony" },
      { number: 3, seatCount: 14, tier: "balcony" },
    ],
  },

  // ──────────────────── БОКОВЫЕ ЯРУСЫ ────────────────────
  // Side boxes (ложи). Vertical columns of 5–6 seats each.
  // 2nd tier = lower side boxes, 3rd tier = upper side boxes.
  // All balcony price tier.

  {
    id: "tier_2_left",
    name: { kz: "2 ярус сол", ru: "2 ярус левый", ug: "2 ярус левый" },
    rows: [{ number: 1, seatCount: 6, tier: "balcony" }],
  },
  {
    id: "tier_2_right",
    name: { kz: "2 ярус оң", ru: "2 ярус правый", ug: "2 ярус правый" },
    rows: [{ number: 1, seatCount: 6, tier: "balcony" }],
  },
  {
    id: "tier_3_left",
    name: { kz: "3 ярус сол", ru: "3 ярус левый", ug: "3 ярус левый" },
    rows: [{ number: 1, seatCount: 5, tier: "balcony" }],
  },
  {
    id: "tier_3_right",
    name: { kz: "3 ярус оң", ru: "3 ярус правый", ug: "3 ярус правый" },
    rows: [{ number: 1, seatCount: 5, tier: "balcony" }],
  },
];

// ============================================================
// HELPERS
// ============================================================

/** Total physical seats in the hall. */
export const TOTAL_SEATS = HALL_CONFIG.reduce(
  (sum, zone) => sum + zone.rows.reduce((s, row) => s + row.seatCount, 0),
  0
);

/** Build a stable seat ID: `${zoneId}-r${rowNumber}-s${seatNumber}` */
export function seatId(zoneId: string, row: number, seat: number): string {
  return `${zoneId}-r${row}-s${seat}`;
}

/** Look up tier for a given zone+row. Returns null if not found. */
export function getRowTier(zoneId: string, rowNumber: number): TierId | null {
  const zone = HALL_CONFIG.find((z) => z.id === zoneId);
  if (!zone) return null;
  return zone.rows.find((r) => r.number === rowNumber)?.tier ?? null;
}

/** Iterate every seat in the hall — useful for seeding the DB. */
export function* iterateSeats(): Generator<{
  zoneId: string;
  rowNumber: number;
  seatNumber: number;
  tier: TierId;
  id: string;
}> {
  for (const zone of HALL_CONFIG) {
    for (const row of zone.rows) {
      for (let seat = 1; seat <= row.seatCount; seat++) {
        yield {
          zoneId: zone.id,
          rowNumber: row.number,
          seatNumber: seat,
          tier: row.tier,
          id: seatId(zone.id, row.number, seat),
        };
      }
    }
  }
}
