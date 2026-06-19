import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { EventHero } from "@/components/event/EventHero";
import {
  BuyFromCta,
  SessionsList,
  type SessionGroup,
} from "@/components/event/SessionsList";
import {
  dateKey,
  formatPrice,
  formatShowDateShort,
  formatTime,
  formatWeekday,
  getEventDescription,
  getEventTitle,
  type AppLocale,
} from "@/lib/format";

type RouteParams = Promise<{ locale: string; slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: RouteParams;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const event = await db.event.findUnique({
    where: { slug },
    select: {
      titleRu: true,
      titleKz: true,
      titleUg: true,
      descriptionRu: true,
      descriptionKz: true,
      descriptionUg: true,
      coverUrl: true,
      isActive: true,
    },
  });
  if (!event || !event.isActive) return {};
  const title = getEventTitle(event, locale as AppLocale);
  const description = getEventDescription(event, locale as AppLocale) ?? undefined;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: event.coverUrl ? [event.coverUrl] : [],
    },
  };
}

type ShowTiers = {
  pricePremium: number;
  priceStandard: number;
  priceEconomy: number;
  priceBalcony: number;
};

function showMinPrice(s: ShowTiers): number {
  return Math.min(
    s.pricePremium,
    s.priceStandard,
    s.priceEconomy,
    s.priceBalcony,
  );
}

export default async function EventDetailPage({
  params,
}: {
  params: RouteParams;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const loc = locale as AppLocale;
  const t = await getTranslations("event.detail");
  const tc = await getTranslations("common");

  const event = await db.event.findUnique({
    where: { slug },
    include: {
      shows: {
        where: { status: "ON_SALE", startsAt: { gte: new Date() } },
        orderBy: { startsAt: "asc" },
      },
    },
  });

  if (!event || !event.isActive) notFound();

  const title = getEventTitle(event, loc);
  const description = getEventDescription(event, loc);

  // ── Metadata grid values ──
  const castValue =
    event.cast.length > 0 ? event.cast.join(", ") : t("empty");
  const durationValue =
    event.durationMin != null
      ? formatDuration(event.durationMin, t("hoursShort"), t("minutesShort"))
      : t("empty");
  const directorValue = event.director ?? t("empty");
  const ageRatingValue = event.ageRating ?? t("empty");

  // ── Price CTA: min across all upcoming on-sale shows ──
  const hasShows = event.shows.length > 0;
  const minPrice = hasShows
    ? Math.min(...event.shows.map(showMinPrice))
    : null;
  const ctaLabel =
    minPrice != null
      ? t("buyFrom", { price: formatPrice(minPrice, loc) })
      : t("comingSoon");

  // ── Sessions grouped by calendar day (server-formatted, locale-aware) ──
  const groupMap = new Map<string, SessionGroup>();
  const groups: SessionGroup[] = [];
  for (const s of event.shows) {
    const key = dateKey(s.startsAt);
    let group = groupMap.get(key);
    if (!group) {
      group = {
        id: key,
        dateLabel: formatShowDateShort(s.startsAt, loc),
        weekdayLabel: formatWeekday(s.startsAt, loc),
        rows: [],
      };
      groupMap.set(key, group);
      groups.push(group);
    }
    group.rows.push({
      id: s.id,
      time: formatTime(s.startsAt, loc),
      priceLabel: tc("priceFrom", {
        price: formatPrice(showMinPrice(s), loc),
      }),
    });
  }

  return (
    <article className="bg-paper">
      {/* Poster — preserved */}
      <EventHero event={event} locale={loc} />

      <div className="mx-auto max-w-5xl px-4 pb-20">
        {/* ── Section 1: Title + metadata grid ── */}
        <section className="py-12">
          <h1 className="font-serif text-5xl italic leading-tight text-ink md:text-6xl">
            {title}
          </h1>
          <div className="rule mt-6" />

          <dl className="mt-10 grid grid-cols-1 gap-x-12 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            <MetaCell label={t("cast")} value={castValue} />
            <MetaCell label={t("duration")} value={durationValue} />
            <MetaCell label={t("director")} value={directorValue} />
            <MetaCell
              label={t("producingTheater")}
              value={t("producingTheaterValue")}
            />
            <MetaCell label={t("ageRating")} value={ageRatingValue} />
          </dl>

          {/* ── Section 2: single price CTA ── */}
          <div className="mt-10">
            <BuyFromCta label={ctaLabel} disabled={!hasShows} />
          </div>
        </section>

        {/* ── Section 3: sessions grouped by date ── */}
        <section id="sessions" className="mt-16 scroll-mt-6">
          <p className="eyebrow text-gold">{t("eyebrow")}</p>
          <h2 className="mt-1 mb-6 font-serif text-3xl italic text-ink">
            {t("schedule")}
          </h2>
          <div className="rounded-xl border border-line bg-paper p-6 shadow-card">
            <SessionsList groups={groups} emptyLabel={t("noShows")} />
          </div>
        </section>

        {/* ── Section 4: about ── */}
        {description && (
          <section className="mt-12">
            <div className="rounded-xl border border-line bg-paper p-8 shadow-card">
              <h2 className="font-serif text-3xl text-ink">{t("about")}</h2>
              <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-ink">
                {description}
              </p>
            </div>
          </section>
        )}
      </div>
    </article>
  );
}

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="mb-1 text-xs uppercase tracking-wide text-ink-soft">
        {label}
      </dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}

/** "2 ч 30 мин" style duration from a minute count. */
function formatDuration(
  totalMin: number,
  hoursShort: string,
  minutesShort: string,
): string {
  const hours = Math.floor(totalMin / 60);
  const minutes = totalMin % 60;
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours} ${hoursShort}`);
  if (minutes > 0) parts.push(`${minutes} ${minutesShort}`);
  return parts.length > 0 ? parts.join(" ") : `${totalMin} ${minutesShort}`;
}
