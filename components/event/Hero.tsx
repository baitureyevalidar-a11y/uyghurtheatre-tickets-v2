import Image from "next/image";
import { Ticket } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/layout/Container";
import { TOTAL_SEATS } from "@/lib/hall-config";
import {
  formatPrice,
  formatShowDate,
  getEventDescription,
  getEventTitle,
  type AppLocale,
} from "@/lib/format";

export type HeroData = {
  slug: string;
  titleRu: string;
  titleKz: string;
  titleUg: string;
  descriptionRu: string | null;
  descriptionKz: string | null;
  descriptionUg: string | null;
  durationMin: number | null;
  posterUrl: string | null;
  nextShow: {
    startsAt: Date;
    pricePremium: number;
    priceStandard: number;
    priceEconomy: number;
    priceBalcony: number;
  };
  /** Free seats remaining for the next show. Drives the scarcity line (< 30%). */
  seatsLeft: number;
};

type HeroProps = {
  event: HeroData;
  locale: AppLocale;
};

const SCARCITY_THRESHOLD = 0.3;

export async function Hero({ event, locale }: HeroProps) {
  const t = await getTranslations("home");
  const title = getEventTitle(event, locale);
  const tagline = getEventDescription(event, locale);
  const minPrice = Math.min(
    event.nextShow.pricePremium,
    event.nextShow.priceStandard,
    event.nextShow.priceEconomy,
    event.nextShow.priceBalcony,
  );
  const durationHours = event.durationMin
    ? Math.max(1, Math.round(event.durationMin / 60))
    : null;
  const isScarce = event.seatsLeft / TOTAL_SEATS < SCARCITY_THRESHOLD;

  return (
    <section className="relative overflow-hidden bg-night text-white">
      <Container className="relative flex flex-col gap-8 py-12 md:flex-row-reverse md:items-center md:gap-14 md:py-20">
        {/* Poster — white frame, ≈ poster-heavy half */}
        <div className="md:w-[42%] md:shrink-0">
          <div className="rounded-2xl bg-white p-3 shadow-md">
            <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-brand-beige">
              {event.posterUrl ? (
                <Image
                  src={event.posterUrl}
                  alt={title}
                  fill
                  sizes="(max-width: 768px) 100vw, 42vw"
                  priority
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center p-6 text-center font-display text-3xl italic text-garnet">
                  {title}
                </div>
              )}
              <span className="absolute left-3 top-3 rounded-md bg-garnet px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-white">
                {t("premiereBadge")}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col gap-6">
          <span className="inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-gold-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-garnet" />
            {t("heroEyebrow")}
          </span>

          <h1 className="font-display text-5xl italic leading-[1.05] tracking-tight text-white md:text-7xl">
            {title}
          </h1>

          {tagline && (
            <p className="max-w-xl text-base leading-relaxed text-white/80 md:text-lg">
              {tagline}
            </p>
          )}

          <div className="h-1 w-16 rounded-full bg-garnet" />

          <div className="flex flex-wrap gap-x-12 gap-y-4">
            <div>
              <div className="mb-1.5 text-[11px] uppercase tracking-[0.12em] text-white/55">
                {t("dateLabel")}
              </div>
              <div className="font-display text-xl text-white md:text-2xl">
                {formatShowDate(event.nextShow.startsAt, locale)}
              </div>
            </div>
            {durationHours && (
              <div>
                <div className="mb-1.5 text-[11px] uppercase tracking-[0.12em] text-white/55">
                  {t("durationLabel")}
                </div>
                <div className="font-display text-xl text-white md:text-2xl">
                  {t("durationValue", { hours: durationHours })} ·{" "}
                  {t("withIntermission")}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
            <Link
              href={`/events/${event.slug}`}
              className="inline-flex items-center gap-2.5 rounded-md bg-garnet px-7 py-4 text-base font-semibold text-white transition-colors hover:bg-garnet-dark"
            >
              <Ticket className="h-5 w-5" />
              {t("heroBuy")}
            </Link>
            <div>
              <div className="text-xs text-white/60">{t("heroFrom")}</div>
              <div className="font-display text-3xl tabular-nums text-white">
                {formatPrice(minPrice, locale)}
              </div>
            </div>
          </div>

          {isScarce && (
            <div className="flex items-center gap-2.5 text-sm text-white/65">
              <span className="relative inline-flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-garnet opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-garnet" />
              </span>
              {t("scarcity", { count: event.seatsLeft })}
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
