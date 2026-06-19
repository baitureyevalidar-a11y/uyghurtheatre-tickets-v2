import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  formatPrice,
  formatShowDate,
  getEventTitle,
  type AppLocale,
} from "@/lib/format";

export type EventCardData = {
  slug: string;
  titleRu: string;
  titleKz: string;
  titleUg: string;
  genre: string | null;
  ageRating: string | null;
  posterUrl: string | null;
  nextShow: {
    startsAt: Date;
    pricePremium: number;
    priceStandard: number;
    priceEconomy: number;
    priceBalcony: number;
  };
};

type EventCardProps = {
  event: EventCardData;
  locale: AppLocale;
  priority?: boolean;
  /** 1-based position in the grid — renders the editorial corner numeral. */
  index?: number;
};

export async function EventCard({
  event,
  locale,
  priority = false,
  index,
}: EventCardProps) {
  const t = await getTranslations("common");
  const title = getEventTitle(event, locale);
  const minPrice = Math.min(
    event.nextShow.pricePremium,
    event.nextShow.priceStandard,
    event.nextShow.priceEconomy,
    event.nextShow.priceBalcony,
  );

  return (
    <Link
      href={`/events/${event.slug}`}
      className="card card-int group flex h-full flex-col"
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        {event.posterUrl ? (
          <Image
            src={event.posterUrl}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            priority={priority}
            className="object-cover transition-transform duration-200 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="ph absolute inset-0 flex items-center justify-center p-4">
            <span className="text-center font-serif text-xl italic text-garnet">
              {title}
            </span>
          </div>
        )}

        {/* Age rating — top-left */}
        {event.ageRating && (
          <span className="absolute left-3 top-3 rounded-full bg-night/80 px-2 py-0.5 text-xs font-medium text-paper">
            {event.ageRating}
          </span>
        )}

        {/* Editorial numeral — top-right watermark */}
        {index != null && (
          <span
            aria-hidden
            className="pointer-events-none absolute right-2 top-0 hidden font-serif text-[90px] font-bold leading-none text-gold-soft/20 md:block"
          >
            {index}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3 md:p-4">
        {event.genre && (
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-garnet">
            {event.genre}
          </div>
        )}
        <h3 className="line-clamp-2 font-serif text-sm font-bold leading-tight text-ink md:text-xl">
          {title}
        </h3>
        <div className="text-sm text-ink-soft">
          {formatShowDate(event.nextShow.startsAt, locale)}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <span className="rounded-full bg-paper-2 px-2 py-1 text-xs text-ink-soft md:px-3 md:text-sm">
            {t("priceFrom", { price: formatPrice(minPrice, locale) })}
          </span>
          <span className="rounded-md border-2 border-garnet px-3 py-1 text-xs font-medium text-garnet transition-colors group-hover:bg-garnet group-hover:text-paper md:px-4 md:py-1.5 md:text-sm">
            {t("buy")}
          </span>
        </div>
      </div>
    </Link>
  );
}
