import { setRequestLocale, getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { Container } from "@/components/layout/Container";
import { EventGrid } from "@/components/event/EventGrid";
import { Hero, type HeroData } from "@/components/event/Hero";
import { TOTAL_SEATS } from "@/lib/hall-config";
import { type AppLocale } from "@/lib/format";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  const now = new Date();
  const events = await db.event.findMany({
    where: {
      isActive: true,
      shows: {
        some: { status: "ON_SALE", startsAt: { gte: now } },
      },
    },
    include: {
      shows: {
        where: { status: "ON_SALE", startsAt: { gte: now } },
        orderBy: { startsAt: "asc" },
        take: 1,
      },
    },
  });

  const sorted = events
    .filter((e) => e.shows.length > 0)
    .sort(
      (a, b) => a.shows[0].startsAt.getTime() - b.shows[0].startsAt.getTime(),
    );

  const cardData = sorted.map((e) => ({
    slug: e.slug,
    titleRu: e.titleRu,
    titleKz: e.titleKz,
    titleUg: e.titleUg,
    genre: e.genre,
    ageRating: e.ageRating,
    posterUrl: e.posterUrl,
    nextShow: e.shows[0],
  }));

  // Featured = soonest upcoming show. Seat scarcity drives the hero's urgency line.
  const featured = sorted[0];
  let heroData: HeroData | null = null;
  if (featured) {
    // ShowSeat rows exist only for taken seats (held/booked/blocked), so the
    // remaining count is the hall total minus existing rows for this show.
    const taken = await db.showSeat.count({
      where: { showId: featured.shows[0].id },
    });
    heroData = {
      slug: featured.slug,
      titleRu: featured.titleRu,
      titleKz: featured.titleKz,
      titleUg: featured.titleUg,
      descriptionRu: featured.descriptionRu,
      descriptionKz: featured.descriptionKz,
      descriptionUg: featured.descriptionUg,
      durationMin: featured.durationMin,
      posterUrl: featured.posterUrl,
      nextShow: featured.shows[0],
      seatsLeft: Math.max(0, TOTAL_SEATS - taken),
    };
  }

  return (
    <>
      {heroData && <Hero event={heroData} locale={locale as AppLocale} />}

      <section className="bg-paper-2">
        <Container className="py-12 md:py-16">
          <header className="mb-8 flex flex-col gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-garnet">
              {t("afishaEyebrow")}
            </span>
            <h2 className="font-display text-3xl leading-tight text-ink md:text-5xl">
              {t("afishaTitle")}{" "}
              <em className="italic text-garnet">{t("afishaTitleAccent")}</em>
            </h2>
          </header>
          <EventGrid events={cardData} locale={locale as AppLocale} />
        </Container>
      </section>
    </>
  );
}
