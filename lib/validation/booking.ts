import { z } from "zod";
import {
  BookingStatus,
  PaymentMethod,
  PaymentStatus,
} from "@prisma/client";

/**
 * Validation + display constants for the admin Bookings module.
 *
 * The list page parses URL searchParams (a trust boundary) with the schema
 * below. Every field is `.catch()`-tolerant: a hand-edited / stale URL must
 * never throw, it just falls back to the default for that field.
 *
 * Admin is Russian-only (CLAUDE.md §6), so labels live here as plain strings
 * rather than in messages/*.json.
 */

export const PAGE_SIZE = 25;

// Status values offered in the filter dropdown (ALL = no status filter).
export const BOOKING_STATUS_FILTERS = [
  "ALL",
  "PAID",
  "PENDING",
  "EXPIRED",
  "REFUNDED",
] as const;
export type BookingStatusFilter = (typeof BOOKING_STATUS_FILTERS)[number];

export const bookingFiltersSchema = z.object({
  q: z.string().catch(""),
  status: z.enum(BOOKING_STATUS_FILTERS).catch("ALL"),
  dateFrom: z.string().catch(""),
  dateTo: z.string().catch(""),
  eventId: z.string().catch(""),
  page: z.coerce.number().int().min(1).catch(1),
});

export type BookingFilters = z.infer<typeof bookingFiltersSchema>;

/** True when any narrowing filter is set (drives the "reset" affordance). */
export function hasActiveFilters(f: BookingFilters): boolean {
  return (
    f.q.trim() !== "" ||
    f.status !== "ALL" ||
    f.dateFrom !== "" ||
    f.dateTo !== "" ||
    f.eventId !== ""
  );
}

// ── Russian display labels ──

export const STATUS_FILTER_LABELS: Record<BookingStatusFilter, string> = {
  ALL: "Все",
  PAID: "Оплачено",
  PENDING: "Ожидает оплаты",
  EXPIRED: "Истекло",
  REFUNDED: "Возвращено",
};

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: "Ожидает оплаты",
  PAID: "Оплачено",
  EXPIRED: "Истекло",
  CANCELLED: "Отменено",
  REFUNDED: "Возвращено",
  PARTIALLY_REFUNDED: "Частичный возврат",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "Ожидает",
  SUCCEEDED: "Оплачено",
  FAILED: "Ошибка",
  REFUNDED: "Возвращено",
  PARTIALLY_REFUNDED: "Частичный возврат",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  KASPI_PAY: "Kaspi Pay",
  EPAY_KZ: "Epay.kz",
  CARD: "Карта",
  CASH: "Наличные",
  COMPED: "Бесплатно",
};

// ── Refund action result ──

export type RefundSummary = {
  refundedAmount: number;
  ticketsCount: number;
};

export type RefundActionResult =
  | { ok: true; summary: RefundSummary }
  | { ok: false; error: string };

/** Pluralize "билет" for Russian counts (1 билет / 2 билета / 5 билетов). */
export function pluralBilet(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "билет";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "билета";
  return "билетов";
}
