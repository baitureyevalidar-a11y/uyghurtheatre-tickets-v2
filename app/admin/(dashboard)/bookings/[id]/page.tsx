import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import type { TicketStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { CopyButton } from "@/components/admin/CopyButton";
import { BookingStatusBadge } from "@/components/admin/BookingStatusBadge";
import { BookingRefundAction } from "@/components/admin/BookingRefundAction";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/validation/booking";
import { formatPrice, formatShowDate } from "@/lib/format";
import { TIER_COLORS, TIER_LABELS, type TierId } from "@/lib/hall-config";

export const metadata = { title: "Бронь — Админка" };

// Single-theater app (CLAUDE.md §13): venue is a constant, not a DB field.
const VENUE = "Уйгурский театр, Алматы";

const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  VALID: "Действителен",
  USED: "Использован",
  CANCELLED: "Отменён",
  REFUNDED: "Возвращён",
};
const TICKET_STATUS_CLASS: Record<TicketStatus, string> = {
  VALID: "bg-state-success-bg text-state-success",
  USED: "bg-bg-muted text-text-secondary",
  CANCELLED: "bg-bg-muted text-text-secondary",
  REFUNDED: "bg-state-error-bg text-state-error",
};

function formatTimestamp(date: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

const KNOWN_TIERS: TierId[] = ["premium", "standard", "economy", "balcony"];
function asTier(value: string): TierId | null {
  return (KNOWN_TIERS as string[]).includes(value) ? (value as TierId) : null;
}

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const booking = await db.booking.findUnique({
    where: { id },
    include: {
      show: { include: { event: true } },
      tickets: { orderBy: [{ zoneId: "asc" }, { row: "asc" }, { seat: "asc" }] },
      payments: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!booking) notFound();

  // Primary payment: prefer a settled one (succeeded/refunded) for the card.
  const payment =
    booking.payments.find(
      (p) => p.status === "SUCCEEDED" || p.status === "REFUNDED",
    ) ?? booking.payments[0];

  const eventTitle = booking.show.event.titleRu;
  const isPaid = booking.status === "PAID";
  const isRefunded = booking.status === "REFUNDED";

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header strip */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/admin/bookings"
            className="inline-flex items-center gap-1.5 text-sm text-text-secondary transition-colors hover:text-brand-teal"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />К списку броней
          </Link>
          <div className="mt-2 flex items-center gap-2">
            <span className="font-mono text-sm text-text-secondary">
              {booking.id}
            </span>
            <CopyButton value={booking.id} label="Скопировать ID брони" />
          </div>
        </div>
        <BookingStatusBadge status={booking.status} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left column */}
        <div className="space-y-6">
          <Card title="Клиент">
            <Field label="Имя" value={booking.customerName || "—"} />
            <Field
              label="Телефон"
              value={
                <a
                  href={`tel:${booking.customerPhone}`}
                  className="text-brand-teal hover:text-brand-teal-dark"
                >
                  {booking.customerPhone}
                </a>
              }
            />
            <Field
              label="Email"
              value={
                booking.customerEmail ? (
                  <a
                    href={`mailto:${booking.customerEmail}`}
                    className="text-brand-teal hover:text-brand-teal-dark"
                  >
                    {booking.customerEmail}
                  </a>
                ) : (
                  "—"
                )
              }
            />
          </Card>

          <Card title="Показ">
            <h3 className="font-display text-xl font-medium text-text-primary">
              {eventTitle}
            </h3>
            <p className="mt-1 text-sm text-text-secondary">
              {formatShowDate(booking.show.startsAt, "ru")}
            </p>
            <p className="mt-0.5 text-sm text-text-tertiary">{VENUE}</p>
            <Link
              href={`/admin/events/${booking.show.eventId}`}
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-teal hover:text-brand-teal-dark"
            >
              Открыть событие
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </Card>

          <Card title="Оплата">
            {payment ? (
              <>
                <Field
                  label="Способ"
                  value={PAYMENT_METHOD_LABELS[payment.method]}
                />
                <Field
                  label="Статус"
                  value={PAYMENT_STATUS_LABELS[payment.status]}
                />
                {/* No dedicated paidAt column yet — payment record time is the proxy. */}
                <Field
                  label="Дата оплаты"
                  value={formatTimestamp(payment.createdAt)}
                />
                {payment.refundedAt && (
                  <Field
                    label="Возврат"
                    value={formatTimestamp(payment.refundedAt)}
                  />
                )}
                {payment.refundReason && (
                  <Field label="Причина возврата" value={payment.refundReason} />
                )}
              </>
            ) : (
              <p className="text-sm text-text-tertiary">Платежей нет</p>
            )}
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <Card title={`Билеты · ${booking.tickets.length}`}>
            {booking.tickets.length === 0 ? (
              <p className="text-sm text-text-tertiary">Билетов нет</p>
            ) : (
              <ul className="space-y-2">
                {booking.tickets.map((tk) => {
                  const tier = asTier(tk.tier);
                  return (
                    <li
                      key={tk.id}
                      className="rounded-md border border-border-default p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-sm font-medium text-text-primary">
                            {tk.zoneName}, ряд {tk.row}, место {tk.seat}
                          </div>
                          <div className="mt-1 flex items-center gap-1.5 text-xs text-text-secondary">
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-full"
                              style={{
                                backgroundColor: tier
                                  ? TIER_COLORS[tier]
                                  : "#D4D4D4",
                              }}
                              aria-hidden
                            />
                            {tier ? TIER_LABELS[tier].ru : tk.tier}
                          </div>
                        </div>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TICKET_STATUS_CLASS[tk.status]}`}
                        >
                          {TICKET_STATUS_LABELS[tk.status]}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-xs text-text-tertiary">
                            {tk.ticketCode}
                          </span>
                          <CopyButton
                            value={tk.ticketCode}
                            label="Скопировать код билета"
                          />
                        </div>
                        <span className="text-sm tabular-nums text-text-primary">
                          {formatPrice(tk.price, "ru")}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card title="История">
            <ol className="space-y-3">
              <TimelineItem
                label="Создана"
                timestamp={formatTimestamp(booking.createdAt)}
              />
              {payment &&
                (payment.status === "SUCCEEDED" ||
                  payment.status === "REFUNDED") && (
                  <TimelineItem
                    label="Оплачена"
                    timestamp={formatTimestamp(payment.createdAt)}
                  />
                )}
              {payment?.refundedAt && (
                <TimelineItem
                  label="Возврат оформлен"
                  timestamp={formatTimestamp(payment.refundedAt)}
                />
              )}
            </ol>
          </Card>
        </div>
      </div>

      {/* Footer action area */}
      <div className="rounded-lg border border-border-default bg-bg-surface p-5">
        {isPaid ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-text-primary">
                Оформить возврат
              </p>
              <p className="text-sm text-text-secondary">
                Вернуть {formatPrice(booking.total, "ru")} клиенту и освободить
                места.
              </p>
            </div>
            <BookingRefundAction
              booking={{
                id: booking.id,
                customerName: booking.customerName,
                customerPhone: booking.customerPhone,
                ticketsCount: booking.tickets.length,
                totalAmount: booking.total,
                showTitle: eventTitle,
                showStartsAt: booking.show.startsAt,
              }}
            />
          </div>
        ) : isRefunded ? (
          <p className="text-sm text-text-secondary">
            Возврат оформлен
            {payment?.refundedAt
              ? ` ${formatTimestamp(payment.refundedAt)}`
              : ""}
            {payment?.refundReason ? `, причина: ${payment.refundReason}` : ""}
          </p>
        ) : (
          <p className="text-sm text-text-tertiary">
            Для этой брони действия недоступны.
          </p>
        )}
      </div>
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border-default bg-bg-surface p-5">
      <h2 className="mb-3 text-xs font-medium tracking-wide text-text-secondary uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex justify-between gap-4 py-1 text-sm">
      <span className="text-text-secondary">{label}</span>
      <span className="text-right text-text-primary">{value}</span>
    </div>
  );
}

function TimelineItem({
  label,
  timestamp,
}: {
  label: string;
  timestamp: string;
}) {
  return (
    <li className="flex items-start gap-3">
      <span
        className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-teal"
        aria-hidden
      />
      <div>
        <div className="text-sm font-medium text-text-primary">{label}</div>
        <div className="text-xs text-text-tertiary">{timestamp}</div>
      </div>
    </li>
  );
}
