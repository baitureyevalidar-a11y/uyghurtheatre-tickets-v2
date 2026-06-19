"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft } from "lucide-react";
import { HALL_CONFIG, seatId, type TierId } from "@/lib/hall-config";
import { zoneTiers } from "@/lib/hall-tiers";
import { hallTierColors, palette } from "@/lib/design-tokens";
import { SEAT_RADIUS, type PositionedSeat } from "@/lib/hall-layout";
import { type AppLocale } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PriceLegend } from "./PriceLegend";

type ZoneDetailProps = {
  zoneId: string;
  seats: PositionedSeat[];
  occupied: Set<string>;
  selected: Set<string>;
  onSeatToggle: (id: string) => void;
  onBack: () => void;
  tierPrices: Record<TierId, number>;
  locale: AppLocale;
};

const LABEL_PAD = 64;
const EDGE_PAD = 28;

export function ZoneDetail({
  zoneId,
  seats,
  occupied,
  selected,
  onSeatToggle,
  onBack,
  tierPrices,
  locale,
}: ZoneDetailProps) {
  const t = useTranslations("seats");
  const zone = HALL_CONFIG.find((z) => z.id === zoneId);
  const zoneName = zone?.name[locale] ?? zoneId;
  const isSideTier = zoneId.startsWith("tier_");

  // Row label anchors (skipped for the narrow vertical side-tier columns).
  const rowLabels = useMemo(() => {
    if (isSideTier) return [];
    const byRow = new Map<number, { cy: number; min: number; max: number }>();
    for (const s of seats) {
      const cur = byRow.get(s.row);
      if (!cur) {
        byRow.set(s.row, { cy: s.cy, min: s.cx, max: s.cx });
      } else {
        cur.min = Math.min(cur.min, s.cx);
        cur.max = Math.max(cur.max, s.cx);
      }
    }
    return [...byRow.entries()].map(([row, v]) => ({ row, ...v }));
  }, [seats, isSideTier]);

  // Bounding box → viewBox, so the zone fills (zooms into) the canvas.
  const viewBox = useMemo(() => {
    if (seats.length === 0) return "0 0 100 100";
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const s of seats) {
      minX = Math.min(minX, s.cx - SEAT_RADIUS);
      maxX = Math.max(maxX, s.cx + SEAT_RADIUS);
      minY = Math.min(minY, s.cy - SEAT_RADIUS);
      maxY = Math.max(maxY, s.cy + SEAT_RADIUS);
    }
    const padX = isSideTier ? EDGE_PAD : LABEL_PAD;
    minX -= padX;
    maxX += padX;
    minY -= EDGE_PAD;
    maxY += EDGE_PAD;
    return `${minX} ${minY} ${maxX - minX} ${maxY - minY}`;
  }, [seats, isSideTier]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 rounded-md border border-line px-3 py-2 text-sm font-medium text-ink transition-colors hover:border-garnet hover:text-garnet"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          {t("backToHall")}
        </button>
        <h2 className="font-serif text-2xl text-ink md:text-3xl">{zoneName}</h2>
      </div>

      <PriceLegend
        tiers={zoneTiers(zoneId)}
        tierPrices={tierPrices}
        locale={locale}
        className="mb-6"
      />

      <div className="overflow-x-auto">
        <svg
          viewBox={viewBox}
          className={cn(
            "mx-auto block w-full",
            isSideTier ? "max-w-[16rem]" : "max-w-3xl",
          )}
          role="group"
          aria-label={zoneName}
        >
          {rowLabels.map((rl) => (
            <g key={`rl-${rl.row}`} style={{ pointerEvents: "none" }}>
              <text
                x={rl.min - 18}
                y={rl.cy}
                textAnchor="end"
                dominantBaseline="middle"
                fill="var(--color-ink-soft)"
                fontSize={9}
              >
                {t("rowLabel")} {rl.row}
              </text>
              <text
                x={rl.max + 18}
                y={rl.cy}
                textAnchor="start"
                dominantBaseline="middle"
                fill="var(--color-ink-soft)"
                fontSize={9}
              >
                {t("rowLabel")} {rl.row}
              </text>
            </g>
          ))}

          {seats.map((s) => {
            const id = seatId(s.zoneId, s.row, s.seat);
            const isOccupied = occupied.has(id);
            const isSelected = selected.has(id);

            const fill = isOccupied
              ? palette.paper2
              : hallTierColors[s.tier];

            const stroke = isOccupied
              ? palette.inkSoft
              : isSelected
                ? palette.garnetDk
                : "transparent";
            const strokeWidth = isOccupied ? 1 : isSelected ? 3 : 0;

            const cls = isOccupied
              ? "zseat zseat-sold"
              : isSelected
                ? "zseat zseat-selected"
                : "zseat zseat-available";

            return (
              <g
                key={id}
                className={cls}
                onClick={isOccupied ? undefined : () => onSeatToggle(id)}
              >
                <circle
                  cx={s.cx}
                  cy={s.cy}
                  r={SEAT_RADIUS}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                />
                <text
                  x={s.cx}
                  y={s.cy}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={6.5}
                  fontWeight={500}
                  fill={isOccupied ? palette.inkSoft : palette.paper}
                  style={{ pointerEvents: "none" }}
                >
                  {s.seat}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
