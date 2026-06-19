"use client";

import { useTranslations } from "next-intl";
import { HALL_CONFIG, type TierId } from "@/lib/hall-config";
import { allHallTiers, zoneMinPrice } from "@/lib/hall-tiers";
import { hallTierColors } from "@/lib/design-tokens";
import { formatPrice, type AppLocale } from "@/lib/format";
import { PriceLegend } from "./PriceLegend";

type HallOverviewProps = {
  onZoneClick: (zoneId: string) => void;
  tierPrices: Record<TierId, number>;
  locale: AppLocale;
};

const VIEWBOX = { w: 800, h: 560 };

/** Tinted fill for a zone background, derived from a tier's design-token color. */
function tint(tier: TierId): string {
  return `color-mix(in srgb, ${hallTierColors[tier]} 14%, transparent)`;
}

type ShapeBase = {
  id: string;
  /** Dominant tier → background tint (amphitheater overrides with a gradient). */
  fill: string;
  label: { x: number; y: number; rotate?: boolean; size: number };
  subtitle?: { x: number; y: number };
};

type RectShape = ShapeBase & {
  kind: "rect";
  rect: { x: number; y: number; w: number; h: number; rx: number };
};
type PathShape = ShapeBase & { kind: "path"; d: string };
type Shape = RectShape | PathShape;

const SHAPES: Shape[] = [
  {
    id: "parter",
    kind: "path",
    d: "M250,100 L550,100 L590,210 L210,210 Z",
    fill: tint("economy"),
    label: { x: 400, y: 150, size: 17 },
    subtitle: { x: 400, y: 174 },
  },
  {
    id: "amphitheater",
    kind: "path",
    d: "M200,235 L600,235 L644,430 L156,430 Z",
    fill: "url(#amfiGrad)",
    label: { x: 400, y: 320, size: 18 },
    subtitle: { x: 400, y: 346 },
  },
  {
    id: "balcony",
    kind: "rect",
    rect: { x: 230, y: 455, w: 340, h: 70, rx: 12 },
    fill: tint("balcony"),
    label: { x: 400, y: 486, size: 16 },
    subtitle: { x: 400, y: 508 },
  },
  {
    id: "tier_2_left",
    kind: "rect",
    rect: { x: 88, y: 235, w: 58, h: 195, rx: 10 },
    fill: tint("balcony"),
    label: { x: 117, y: 332, rotate: true, size: 12 },
  },
  {
    id: "tier_2_right",
    kind: "rect",
    rect: { x: 654, y: 235, w: 58, h: 195, rx: 10 },
    fill: tint("balcony"),
    label: { x: 683, y: 332, rotate: true, size: 12 },
  },
  {
    id: "tier_3_left",
    kind: "rect",
    rect: { x: 30, y: 235, w: 48, h: 195, rx: 10 },
    fill: tint("balcony"),
    label: { x: 54, y: 332, rotate: true, size: 11 },
  },
  {
    id: "tier_3_right",
    kind: "rect",
    rect: { x: 722, y: 235, w: 48, h: 195, rx: 10 },
    fill: tint("balcony"),
    label: { x: 746, y: 332, rotate: true, size: 11 },
  },
];

export function HallOverview({
  onZoneClick,
  tierPrices,
  locale,
}: HallOverviewProps) {
  const t = useTranslations("seats");
  const tc = useTranslations("common");

  const zoneName = (id: string) =>
    (HALL_CONFIG.find((z) => z.id === id)?.name[locale] ?? id).toUpperCase();

  return (
    <div>
      <PriceLegend
        tiers={allHallTiers()}
        tierPrices={tierPrices}
        locale={locale}
        className="mb-6 justify-center"
      />

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${VIEWBOX.w} ${VIEWBOX.h}`}
          className="mx-auto block w-full max-w-3xl"
          role="group"
          aria-label={t("stage")}
        >
          <defs>
            <linearGradient id="amfiGrad" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={hallTierColors.premium}
                stopOpacity="0.16"
              />
              <stop
                offset="50%"
                stopColor={hallTierColors.standard}
                stopOpacity="0.15"
              />
              <stop
                offset="100%"
                stopColor={hallTierColors.economy}
                stopOpacity="0.14"
              />
            </linearGradient>
          </defs>

          {/* Stage — not clickable */}
          <rect
            x={300}
            y={30}
            width={200}
            height={44}
            rx={10}
            fill="var(--color-paper-2)"
            stroke="var(--color-line)"
          />
          <text
            x={400}
            y={54}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="var(--color-ink-soft)"
            fontSize={13}
            fontWeight={600}
            letterSpacing="0.16em"
          >
            {t("stage")}
          </text>

          {SHAPES.map((shape) => (
            <g
              key={shape.id}
              className="zone-shape"
              role="button"
              tabIndex={0}
              aria-label={zoneName(shape.id)}
              onClick={() => onZoneClick(shape.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onZoneClick(shape.id);
                }
              }}
            >
              {shape.kind === "rect" ? (
                <rect
                  className="zone-bg"
                  x={shape.rect.x}
                  y={shape.rect.y}
                  width={shape.rect.w}
                  height={shape.rect.h}
                  rx={shape.rect.rx}
                  fill={shape.fill}
                  stroke="var(--color-line)"
                  strokeWidth={1}
                />
              ) : (
                <path
                  className="zone-bg"
                  d={shape.d}
                  fill={shape.fill}
                  stroke="var(--color-line)"
                  strokeWidth={1}
                  strokeLinejoin="round"
                />
              )}

              <text
                x={shape.label.x}
                y={shape.label.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="var(--color-ink)"
                fontSize={shape.label.size}
                fontWeight={600}
                letterSpacing="0.08em"
                style={{ pointerEvents: "none" }}
                transform={
                  shape.label.rotate
                    ? `rotate(-90 ${shape.label.x} ${shape.label.y})`
                    : undefined
                }
              >
                {zoneName(shape.id)}
              </text>

              {shape.subtitle && (
                <text
                  x={shape.subtitle.x}
                  y={shape.subtitle.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="var(--color-ink-soft)"
                  fontSize={12}
                  style={{ pointerEvents: "none" }}
                >
                  {tc("priceFrom", {
                    price: formatPrice(
                      zoneMinPrice(shape.id, tierPrices),
                      locale,
                    ),
                  })}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
