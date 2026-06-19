import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { X } from "lucide-react";
import { db } from "@/lib/db";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/layout/Container";
import { SeatSelectionView } from "@/components/hall/SeatSelectionView";
import { ShowCancelledNotice } from "@/components/event/ShowCancelledNotice";
import {
  formatShowDate,
  getEventTitle,
  type AppLocale,
} from "@/lib/format";
import { seatId, type TierId } from "@/lib/hall-config";
import { getSeatPositions } from "@/lib/hall-layout";

type RouteParams = Promise<{ locale: string; id: string }>;

export async function generateMetadata({
  params,
}: {
  params: RouteParams;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const show = await db.show.findUnique({
    where: { id },
    include: { event: true },
  });
  if (!show || show.status !== "ON_SALE") return {};
  return { title: getEventTitle(show.event, locale as AppLocale) };
}

export default async function SeatsPage({
  params,
}: {
  params: RouteParams;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const show = await db.show.findUnique({
    where: { id },
    include: { event: true },
  });
  if (!show) notFound();

  // Cancelled shows render the public notice instead of a seat map (deep-link).
  if (show.status === "CANCELLED") {
    return (
      <ShowCancelledNotice
        eventSlug={show.event.slug}
        locale={locale as AppLocale}
      />
    );
  }
  if (show.status !== "ON_SALE") notFound();

  const appLocale = locale as AppLocale;
  const t = await getTranslations("seats");
  const title = getEventTitle(show.event, appLocale);

  const tierPrices: Record<TierId, number> = {
    premium: show.pricePremium,
    standard: show.priceStandard,
    economy: show.priceEconomy,
    balcony: show.priceBalcony,
  };

  const positionedSeats = getSeatPositions();

  const now = new Date();
  const unavailableShowSeats = await db.showSeat.findMany({
    where: {
      showId: show.id,
      OR: [
        { status: { in: ["BOOKED", "BLOCKED", "VIP_HOLD"] } },
        { AND: [{ status: "HELD" }, { holdExpiresAt: { gt: now } }] },
      ],
    },
    select: { zoneId: true, row: true, seat: true },
  });
  const unavailableSeatIds = unavailableShowSeats.map((s) =>
    seatId(s.zoneId, s.row, s.seat),
  );

  return (
    <div className="min-h-screen bg-paper">
      {/* Branded title strip */}
      <div className="border-b border-line bg-garnet text-paper">
        <Container className="flex items-center justify-between gap-4 p-4">
          <div className="min-w-0">
            <h1 className="truncate font-serif text-xl leading-tight md:text-2xl">
              {title}
            </h1>
            <div className="mt-0.5 text-sm text-paper/80">
              {formatShowDate(show.startsAt, appLocale)}
            </div>
          </div>
          <Link
            href={`/events/${show.event.slug}`}
            aria-label={t("back")}
            className="shrink-0 rounded-full p-2 transition-colors hover:bg-white/10"
          >
            <X className="h-5 w-5" aria-hidden />
          </Link>
        </Container>
      </div>

      <Container className="py-8 pb-40">
        <SeatSelectionView
          showId={show.id}
          positionedSeats={positionedSeats}
          unavailableSeatIds={unavailableSeatIds}
          tierPrices={tierPrices}
          locale={appLocale}
        />
      </Container>
    </div>
  );
}
