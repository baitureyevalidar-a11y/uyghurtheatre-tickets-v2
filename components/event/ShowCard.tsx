import { ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  formatPrice,
  formatShowDateShort,
  formatShowDayTime,
  type AppLocale,
} from "@/lib/format";

export type ShowCardData = {
  id: string;
  startsAt: Date;
  pricePremium: number;
  priceStandard: number;
  priceEconomy: number;
  priceBalcony: number;
};

type ShowCardProps = {
  show: ShowCardData;
  locale: AppLocale;
};

export async function ShowCard({ show, locale }: ShowCardProps) {
  const t = await getTranslations("common");
  const minPrice = Math.min(
    show.pricePremium,
    show.priceStandard,
    show.priceEconomy,
    show.priceBalcony,
  );

  return (
    <Link
      href={`/shows/${show.id}/seats`}
      className="flex items-center justify-between gap-4 rounded-lg border border-border-default bg-bg-surface px-5 py-4 transition-all duration-200 hover:border-border-strong hover:bg-bg-muted"
    >
      <div className="flex min-w-0 flex-col gap-1">
        <div className="font-display text-xl font-medium text-text-primary">
          {formatShowDateShort(show.startsAt, locale)}
        </div>
        <div className="text-sm text-text-secondary">
          {formatShowDayTime(show.startsAt, locale)}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="text-sm font-medium text-brand-teal">
          {t("priceFrom", { price: formatPrice(minPrice, locale) })}
        </span>
        <ChevronRight className="h-5 w-5 text-text-tertiary" aria-hidden />
      </div>
    </Link>
  );
}
