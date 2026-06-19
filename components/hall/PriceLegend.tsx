import { type TierId } from "@/lib/hall-config";
import { hallTierColors } from "@/lib/design-tokens";
import { formatPrice, type AppLocale } from "@/lib/format";
import { cn } from "@/lib/utils";

type PriceLegendProps = {
  /** Tiers to show, in display order. */
  tiers: TierId[];
  tierPrices: Record<TierId, number>;
  locale: AppLocale;
  className?: string;
};

/**
 * Horizontal row of price pills — one per tier present. Colored dot + price.
 * Shared by HallOverview (all tiers) and ZoneDetail (subset for one zone).
 * Tier colors come from the design-token CSS vars (garnet/gold/ink-soft/ember).
 */
export function PriceLegend({
  tiers,
  tierPrices,
  locale,
  className,
}: PriceLegendProps) {
  return (
    <ul className={cn("flex flex-wrap gap-2", className)}>
      {tiers.map((tier) => (
        <li
          key={tier}
          className="inline-flex items-center gap-2 rounded-full border border-line bg-paper-2 px-3 py-1.5"
        >
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: hallTierColors[tier] }}
            aria-hidden
          />
          <span className="text-sm font-medium text-ink">
            {formatPrice(tierPrices[tier], locale)}
          </span>
        </li>
      ))}
    </ul>
  );
}
