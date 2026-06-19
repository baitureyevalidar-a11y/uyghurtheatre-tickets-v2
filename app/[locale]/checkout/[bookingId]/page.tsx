import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { ChevronLeft } from "lucide-react";
import { db } from "@/lib/db";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/layout/Container";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { ShowCancelledNotice } from "@/components/event/ShowCancelledNotice";
import { readSessionId } from "@/lib/session";
import { HALL_CONFIG, getRowTier, type TierId } from "@/lib/hall-config";
import { getEventTitle, type AppLocale } from "@/lib/format";

type RouteParams = Promise<{ locale: string; bookingId: string }>;

export async function generateMetadata({
  params,
}: {
  params: RouteParams;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "checkout" });
  return { title: t("title") };
}

export default async function CheckoutPage({
  params,
}: {
  params: RouteParams;
}) {
  const { locale, bookingId } = await params;
  setRequestLocale(locale);
  const appLocale = locale as AppLocale;

  const t = await getTranslations("checkout");

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { show: { include: { event: true } } },
  });
  if (!booking) notFound();

  // Already paid → straight to success (idempotent reload of completed flow).
  if (booking.status === "PAID") {
    redirect(`/${locale}/checkout/${bookingId}/success`);
  }

  // Show cancelled mid-checkout (race): cancelShowAction already moved this
  // PENDING booking to EXPIRED + released its seats. Surface the cancellation
  // explicitly instead of the generic expired page. Checked before the
  // non-PENDING gate below, which would otherwise mask it.
  if (booking.show.status === "CANCELLED") {
    return (
      <ShowCancelledNotice
        eventSlug={booking.show.event.slug}
        locale={appLocale}
      />
    );
  }

  // Terminal non-PENDING states render the expired-page UI.
  if (booking.status !== "PENDING") {
    return <ExpiredView locale={appLocale} showId={booking.showId} />;
  }

  // Explicit time expiration short-circuits the seat lookup.
  const now = new Date();
  if (booking.expiresAt && booking.expiresAt < now) {
    return <ExpiredView locale={appLocale} showId={booking.showId} />;
  }

  const sessionId = await readSessionId();
  if (!sessionId) {
    // No session cookie at all — must be a different browser than the one that held.
    return <WrongSessionView locale={appLocale} />;
  }
  const heldSeats = await db.showSeat.findMany({
    where: {
      showId: booking.showId,
      holdSessionId: sessionId,
      status: "HELD",
    },
    orderBy: [{ zoneId: "asc" }, { row: "asc" }, { seat: "asc" }],
  });

  if (heldSeats.length === 0) {
    // PENDING + not time-expired + no seats for this cookie ⇒ someone else's
    // booking opened from this browser. Show the wrong-session page.
    return <WrongSessionView locale={appLocale} />;
  }

  const tierPrice: Record<TierId, number> = {
    premium: booking.show.pricePremium,
    standard: booking.show.priceStandard,
    economy: booking.show.priceEconomy,
    balcony: booking.show.priceBalcony,
  };

  const seatRows = heldSeats.map((s) => {
    const tier = getRowTier(s.zoneId, s.row);
    const zone = HALL_CONFIG.find((z) => z.id === s.zoneId);
    return {
      zoneName: zone?.name[appLocale] ?? s.zoneId,
      row: s.row,
      seat: s.seat,
      price: tier ? tierPrice[tier] : 0,
    };
  });

  const eventTitle = getEventTitle(booking.show.event, appLocale);

  return (
    <Container className="py-8">
      <div className="mb-6">
        <Link
          href={`/events/${booking.show.event.slug}`}
          className="inline-flex items-center gap-1 text-sm text-text-secondary transition-colors hover:text-brand-teal"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          <span className="truncate">{eventTitle}</span>
        </Link>
        <h1 className="mt-2 font-display text-3xl font-medium leading-tight text-text-primary md:text-4xl">
          {t("title")}
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CheckoutForm
            bookingId={booking.id}
            total={booking.total}
            locale={appLocale}
          />
        </div>
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-8">
            <OrderSummary
              event={booking.show.event}
              startsAt={booking.show.startsAt}
              seats={seatRows}
              total={booking.total}
              locale={appLocale}
              expiresAt={booking.expiresAt}
            />
          </div>
        </div>
      </div>
    </Container>
  );
}

async function ExpiredView({
  locale,
  showId,
}: {
  locale: AppLocale;
  showId: string;
}) {
  const t = await getTranslations("checkout.expiredPage");
  return (
    <Container>
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <h2 className="font-display text-3xl font-medium text-text-primary md:text-4xl">
          {t("title")}
        </h2>
        <p className="max-w-md text-text-secondary">{t("description")}</p>
        <Link
          href={`/shows/${showId}/seats`}
          className="mt-2 inline-flex items-center justify-center rounded-md bg-brand-teal px-5 py-3 text-sm font-medium text-white transition-colors duration-200 hover:bg-brand-teal-dark"
        >
          {t("backToSeats")}
        </Link>
      </div>
    </Container>
  );
}

async function WrongSessionView({ locale }: { locale: AppLocale }) {
  const t = await getTranslations("checkout.wrongSessionPage");
  return (
    <Container>
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <h2 className="font-display text-3xl font-medium text-text-primary md:text-4xl">
          {t("title")}
        </h2>
        <p className="max-w-md text-text-secondary">{t("description")}</p>
        <Link
          href="/"
          className="mt-2 inline-flex items-center justify-center rounded-md bg-brand-teal px-5 py-3 text-sm font-medium text-white transition-colors duration-200 hover:bg-brand-teal-dark"
        >
          {t("backHome")}
        </Link>
      </div>
    </Container>
  );
}
