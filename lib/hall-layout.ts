/**
 * hall-layout.ts
 *
 * Geometric positioning for the SVG hall map. Pure function of `hall-config.ts`.
 * Coordinates are in the SVG user space (`viewBox 0 0 800 700`).
 *
 * Layout philosophy: gentle trapezoid fans (not true arcs) — the goal is "obviously
 * a theater hall" at a glance, not architectural fidelity. Real curves come later if
 * needed.
 */

import { HALL_CONFIG, type TierId, type Zone } from "./hall-config";

export type PositionedSeat = {
  zoneId: string;
  row: number;
  seat: number;
  tier: TierId;
  cx: number;
  cy: number;
};

export type ZoneLabel = {
  zoneId: string;
  x: number;
  y: number;
  textAnchor: "start" | "middle" | "end";
};

export const SVG_VIEWBOX = { width: 800, height: 700 };
export const SEAT_RADIUS = 7;
export const STAGE = { x: 250, y: 20, width: 300, height: 40 };

const CENTER_X = SVG_VIEWBOX.width / 2;
const SEAT_PITCH_X = 16;
const SEAT_PITCH_Y = 22;

// Vertical anchor (top of first row) for each main zone.
const ZONE_Y: Record<string, number> = {
  parter: 95,
  amphitheater: 210,
  balcony: 455,
};

// Aisle gap for split balcony rows 2 and 3.
const BALCONY_AISLE_GAP = 50;

// Side-tier columns sit on the very edges, vertically aligned with main floor levels.
const SIDE_TIER_LEFT_X = 35;
const SIDE_TIER_RIGHT_X = SVG_VIEWBOX.width - 35;
// tier_3 ("upper" side boxes) sits adjacent to parter; tier_2 ("lower" side boxes)
// runs alongside amphitheater. Order is a visual convention — see CLAUDE.md notes.
const TIER_3_Y_START = 95;
const TIER_2_Y_START = 230;

function positionFanZone(zone: Zone): PositionedSeat[] {
  const out: PositionedSeat[] = [];
  const yStart = ZONE_Y[zone.id];
  zone.rows.forEach((row, rowIndex) => {
    const y = yStart + rowIndex * SEAT_PITCH_Y;
    const rowWidth = (row.seatCount - 1) * SEAT_PITCH_X;
    const xStart = CENTER_X - rowWidth / 2;
    for (let s = 0; s < row.seatCount; s++) {
      out.push({
        zoneId: zone.id,
        row: row.number,
        seat: s + 1,
        tier: row.tier,
        cx: xStart + s * SEAT_PITCH_X,
        cy: y,
      });
    }
  });
  return out;
}

function positionBalconyZone(zone: Zone): PositionedSeat[] {
  const out: PositionedSeat[] = [];
  const yStart = ZONE_Y[zone.id];
  zone.rows.forEach((row, rowIndex) => {
    const y = yStart + rowIndex * SEAT_PITCH_Y;
    if (row.number === 1) {
      // Front balcony row — single continuous arc, no aisle.
      const rowWidth = (row.seatCount - 1) * SEAT_PITCH_X;
      const xStart = CENTER_X - rowWidth / 2;
      for (let s = 0; s < row.seatCount; s++) {
        out.push({
          zoneId: zone.id,
          row: row.number,
          seat: s + 1,
          tier: row.tier,
          cx: xStart + s * SEAT_PITCH_X,
          cy: y,
        });
      }
      return;
    }
    // Rows 2 and 3 — center aisle. Split seats into left/right halves,
    // numbering left-to-right contiguous (1..leftCount on left, leftCount+1..total on right).
    const leftCount = Math.ceil(row.seatCount / 2);
    const rightCount = row.seatCount - leftCount;
    const leftEnd = CENTER_X - BALCONY_AISLE_GAP / 2;
    for (let s = 0; s < leftCount; s++) {
      out.push({
        zoneId: zone.id,
        row: row.number,
        seat: s + 1,
        tier: row.tier,
        cx: leftEnd - (leftCount - 1 - s) * SEAT_PITCH_X,
        cy: y,
      });
    }
    const rightStart = CENTER_X + BALCONY_AISLE_GAP / 2;
    for (let s = 0; s < rightCount; s++) {
      out.push({
        zoneId: zone.id,
        row: row.number,
        seat: leftCount + s + 1,
        tier: row.tier,
        cx: rightStart + s * SEAT_PITCH_X,
        cy: y,
      });
    }
  });
  return out;
}

function positionSideTier(zone: Zone): PositionedSeat[] {
  const out: PositionedSeat[] = [];
  const isLeft = zone.id.endsWith("_left");
  const isTier2 = zone.id.startsWith("tier_2");
  const cx = isLeft ? SIDE_TIER_LEFT_X : SIDE_TIER_RIGHT_X;
  const yStart = isTier2 ? TIER_2_Y_START : TIER_3_Y_START;
  zone.rows.forEach((row) => {
    for (let s = 0; s < row.seatCount; s++) {
      out.push({
        zoneId: zone.id,
        row: row.number,
        seat: s + 1,
        tier: row.tier,
        cx,
        cy: yStart + s * SEAT_PITCH_Y,
      });
    }
  });
  return out;
}

export function getSeatPositions(): PositionedSeat[] {
  const out: PositionedSeat[] = [];
  for (const zone of HALL_CONFIG) {
    if (zone.id === "parter" || zone.id === "amphitheater") {
      out.push(...positionFanZone(zone));
    } else if (zone.id === "balcony") {
      out.push(...positionBalconyZone(zone));
    } else if (zone.id.startsWith("tier_")) {
      out.push(...positionSideTier(zone));
    }
  }
  return out;
}

// Main-zone labels render above each section. Side-tier labels are omitted in v1
// because the columns are narrow and self-explanatory from position.
export const ZONE_LABELS: ZoneLabel[] = [
  { zoneId: "parter", x: CENTER_X, y: 83, textAnchor: "middle" },
  { zoneId: "amphitheater", x: CENTER_X, y: 198, textAnchor: "middle" },
  { zoneId: "balcony", x: CENTER_X, y: 443, textAnchor: "middle" },
];
