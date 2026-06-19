import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ChevronDown, Ticket } from "lucide-react";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/layout/Container";
import { HoldTimer } from "@/components/checkout/HoldTimer";
import { TicketCard } from "@/components/checkout/TicketCard";
import {
  getActivePendingBooking,
  getOwnedPaidBookings,
  type PaidBooking,
  type PendingBookingResult,
} from "@/lib/cart-lookup";
import { HALL_CONFIG, getRowTier, type TierId } from "@/lib/hall-config";
import {
  formatPrice,
  formatShowDate,
  getEventTitle,
  type AppLocale,
} from "@/lib/format";

type RouteParams = Promise<{ locale: string }>;

export async function generateMetadata({
  params,
}: {
  params: RouteParams;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "cart" });
  return { title: t("title") };
}

export default async function CartPage({ params }: { params: RouteParams }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const appLocale = locale as AppLocale;
  const t = await getTranslations("cart");

  const store = await cookies();
  const sessionId = store.get("uyg_session")?.value;
  const bookingIds = store
    .getAll()
    .filter((c) => c.name.startsWith("booking_") && c.value === "owner")
    .map((c) => c.name.slice("booking_".length));

  const [pending, paid] = await Promise.all([
    getActivePendingBooking(sessionId),
    getOwnedPaidBookings(bookingIds),
  ]);

  const now = Date.now();
  const upcoming = paid.filter((b) => b.show.startsAt.getTime() > now);
  const past = paid.filter((b) => b.show.startsAt.getTime() <= now);
  const isEmpty = !pending && paid.length === 0;

  return (
    <Container className="py-10 md:py-14">
      <h1 className="font-serif text-3xl font-bold text-ink md:text-4xl">
        {t("title")}
      </h1>

      {isEmpty ? (
        <EmptyState locale={appLocale} />
      ) : (
        <div className="mt-8 flex flex-col gap-12">
          {pending && <PendingCard result={pending} locale={appLocale} />}

          {paid.length > 0 && (
            <section>
              <h2 className="mb-5 font-serif text-2xl font-bold text-ink">
                {t("myTickets")}
              </h2>

              {upcoming.length > 0 && (
                <div className="flex flex-col gap-6">
                  <SectionLabel>{t("upcoming")}</SectionLabel>
                  {upcoming.map((b) => (
                    <PaidBookingCard key={b.id} booking={b} locale={appLocale} />
                  ))}
                </div>
              )}

              {past.length > 0 && (
                <details className="group mt-8">
                  <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-ink-soft transition-colors hover:text-garnet">
                    <ChevronDown
                      className="h-4 w-4 transition-transform group-open:rotate-180"
                      aria-hidden
                    />
                    {t("showPast", { count: past.length })}
                  </summary>
                  <div className="mt-6 flex flex-col gap-6">
                    {past.map((b) => (
                      <PaidBookingCard
                        key={b.id}
                        booking={b}
                        locale={appLocale}
                        muted
                      />
                    ))}
                  </div>
                </details>
              )}
            </section>
          )}
        </div>
      )}
    </Container>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="eyebrow text-garnet">{children}</div>
  );
}

async function PendingCard({
  result,
  locale,
}: {
  result: NonNullable<PendingBookingResult>;
  locale: AppLocale;
}) {
  const t = await getTranslations("cart");
  const { booking, heldSeats } = result;
  const title = getEventTitle(booking.show.event, locale);

  const tierPrice: Record<TierId, number> = {
    premium: booking.show.pricePremium,
    standard: booking.show.priceStandard,
    economy: booking.show.priceEconomy,
    balcony: booking.show.priceBalcony,
  };
  const seats = heldSeats.map((s) => {
    const tier = getRowTier(s.zoneId, s.row);
    const zone = HALL_CONFIG.find((z) => z.id === s.zoneId);
    return {
      key: `${s.zoneId}-${s.row}-${s.seat}`,
      zoneName: zone?.name[locale] ?? s.zoneId,
      row: s.row,
      seat: s.seat,
      price: tier ? tierPrice[tier] : 0,
    };
  });

  return (
    <section className="card p-5 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <SectionLabel>{t("activeBooking")}</SectionLabel>
        {booking.expiresAt && (
          <HoldTimer expiresAt={booking.expiresAt.toISOString()} />
        )}
      </div>

      <h2 className="mt-2 font-serif text-2xl font-bold text-ink">{title}</h2>
      <p className="mt-1 text-sm text-ink-soft">
        {formatShowDate(booking.show.startsAt, locale)}
      </p>

      <ul className="mt-4 divide-y divide-line border-y border-line">
        {seats.map((s) => (
          <li
            key={s.key}
            className="flex items-center justify-between gap-3 py-2.5 text-sm"
          >
            <span className="text-ink">
              {s.zoneName} · {t("rowSeat", { row: s.row, seat: s.seat })}
            </span>
            <span className="tabular-nums text-ink-soft">
              {formatPrice(s.price, locale)}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs text-ink-soft">{t("total")}</div>
          <div className="font-serif text-2xl font-bold tabular-nums text-ink">
            {formatPrice(booking.total, locale)}
          </div>
        </div>
        <Link
          href={`/checkout/${booking.id}`}
          className="cta px-6 py-3.5 text-base"
        >
          <Ticket className="h-5 w-5" aria-hidden />
          {t("continuePayment")}
        </Link>
      </div>
    </section>
  );
}

async function PaidBookingCard({
  booking,
  locale,
  muted = false,
}: {
  booking: PaidBooking;
  locale: AppLocale;
  muted?: boolean;
}) {
  const title = getEventTitle(booking.show.event, locale);
  return (
    <article className={`card p-5 md:p-6 ${muted ? "opacity-75" : ""}`}>
      <h3 className="font-serif text-xl font-bold text-ink">{title}</h3>
      <p className="mt-1 text-sm text-ink-soft">
        {formatShowDate(booking.show.startsAt, locale)}
      </p>
      <div className="mt-4 flex flex-col gap-4">
        {booking.tickets.map((tk) => (
          <TicketCard
            key={tk.id}
            ticket={{
              ticketCode: tk.ticketCode,
              qrPayload: tk.qrPayload,
              zoneName: tk.zoneName,
              row: tk.row,
              seat: tk.seat,
              price: tk.price,
            }}
            locale={locale}
          />
        ))}
      </div>
    </article>
  );
}

async function EmptyState({ locale }: { locale: AppLocale }) {
  const t = await getTranslations("cart");
  return (
    <div className="mx-auto mt-12 flex max-w-md flex-col items-center gap-5 rounded-[18px] border border-line bg-white p-10 text-center">
      <h2 className="font-serif text-2xl font-bold text-ink">
        {t("emptyTitle")}
      </h2>
      <p className="text-ink-soft">{t("emptyBody")}</p>
      <Link href="/" className="cta px-6 py-3.5 text-base">
        <Ticket className="h-5 w-5" aria-hidden />
        {t("toAfisha")}
      </Link>
    </div>
  );
}
