import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { CheckCircle } from "lucide-react";
import { db } from "@/lib/db";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/layout/Container";
import { TicketCard } from "@/components/checkout/TicketCard";
import {
  formatPrice,
  formatShowDate,
  getEventTitle,
  type AppLocale,
} from "@/lib/format";

type RouteParams = Promise<{ locale: string; bookingId: string }>;

export async function generateMetadata({
  params,
}: {
  params: RouteParams;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "checkout.success",
  });
  return { title: t("title") };
}

export default async function SuccessPage({
  params,
}: {
  params: RouteParams;
}) {
  const { locale, bookingId } = await params;
  setRequestLocale(locale);
  const appLocale = locale as AppLocale;

  const t = await getTranslations("checkout.success");

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: {
      show: { include: { event: true } },
      tickets: { orderBy: [{ zoneId: "asc" }, { row: "asc" }, { seat: "asc" }] },
    },
  });
  if (!booking) notFound();

  if (booking.status !== "PAID") {
    redirect(`/${locale}/checkout/${bookingId}`);
  }

  // Ownership check — payment action set `booking_<id>` cookie on the buying browser.
  const store = await cookies();
  const ownerCookie = store.get(`booking_${booking.id}`)?.value;
  if (ownerCookie !== "owner") {
    const tWrong = await getTranslations("checkout.wrongSessionPage");
    return (
      <Container>
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <h2 className="font-display text-3xl font-medium text-text-primary md:text-4xl">
            {tWrong("title")}
          </h2>
          <p className="max-w-md text-text-secondary">
            {tWrong("description")}
          </p>
          <Link
            href="/"
            className="mt-2 inline-flex items-center justify-center rounded-md bg-brand-teal px-5 py-3 text-sm font-medium text-white transition-colors duration-200 hover:bg-brand-teal-dark"
          >
            {tWrong("backHome")}
          </Link>
        </div>
      </Container>
    );
  }

  const eventTitle = getEventTitle(booking.show.event, appLocale);

  return (
    <Container className="py-12">
      <header className="flex flex-col items-center gap-3 text-center">
        <CheckCircle
          className="h-12 w-12 text-state-success"
          strokeWidth={1.5}
          aria-hidden
        />
        <h1 className="font-display text-3xl font-medium text-text-primary md:text-4xl">
          {t("title")}
        </h1>
        <p className="max-w-xl text-text-secondary">{t("subtitle")}</p>
      </header>

      <section className="mx-auto mt-10 max-w-2xl">
        <div className="mb-6 text-center">
          <div className="font-display text-xl text-text-primary">
            {eventTitle}
          </div>
          <div className="text-sm text-text-secondary">
            {formatShowDate(booking.show.startsAt, appLocale)}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {booking.tickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={{
                ticketCode: ticket.ticketCode,
                qrPayload: ticket.qrPayload,
                zoneName: ticket.zoneName,
                row: ticket.row,
                seat: ticket.seat,
                price: ticket.price,
              }}
              locale={appLocale}
            />
          ))}
        </div>

        <div className="mt-6 flex items-baseline justify-between border-t border-border-default pt-4">
          <span className="text-sm font-semibold text-text-primary">
            {(await getTranslations("checkout"))("total")}
          </span>
          <span className="font-display text-xl font-medium text-text-primary">
            {formatPrice(booking.total, appLocale)}
          </span>
        </div>

        <div className="mt-8 flex justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-border-default bg-bg-surface px-5 py-3 text-sm font-medium text-text-primary transition-colors duration-200 hover:border-border-strong hover:bg-bg-muted"
          >
            {t("backHome")}
          </Link>
        </div>
      </section>
    </Container>
  );
}
