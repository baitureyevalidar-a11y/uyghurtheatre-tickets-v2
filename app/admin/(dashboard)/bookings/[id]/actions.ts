"use server";

import { revalidatePath } from "next/cache";
import {
  BookingStatus,
  PaymentStatus,
  TicketStatus,
  UserRole,
} from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { RefundActionResult } from "@/lib/validation/booking";

const LOCALES = ["ru", "kz", "ug"] as const;

/**
 * Refund a single booking (admin-initiated, e.g. customer phones in).
 *
 * Mirrors the cascade shape of cancelShowAction (Session 7.3) but scoped to
 * one booking. DB-only refund stub: real Kaspi/Epay refund API calls land in
 * Session 10. Everything runs in one transaction with server-side re-validation
 * (never trust the page's view of the status — it can change before submit).
 */
export async function refundBookingAction(
  bookingId: string,
): Promise<RefundActionResult> {
  // Defensive auth: the layout gates the UI, but actions can be called directly.
  const session = await auth();
  const userId = session?.user?.id;
  const role = session?.user?.role;
  if (!userId || (role !== UserRole.ADMIN && role !== UserRole.SUPER_ADMIN)) {
    return { ok: false, error: "Недостаточно прав" };
  }

  type Outcome =
    | { kind: "not_found" }
    | { kind: "already" }
    | { kind: "not_paid" }
    | {
        kind: "ok";
        showId: string;
        eventId: string;
        summary: { refundedAmount: number; ticketsCount: number };
      };

  let outcome: Outcome;
  try {
    outcome = await db.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: {
          tickets: { select: { id: true, zoneId: true, row: true, seat: true } },
          show: { select: { id: true, eventId: true } },
        },
      });
      if (!booking) return { kind: "not_found" } as const;
      if (booking.status === BookingStatus.REFUNDED) {
        return { kind: "already" } as const;
      }
      if (booking.status !== BookingStatus.PAID) {
        return { kind: "not_paid" } as const;
      }

      const now = new Date();
      // Money returned == what the customer actually paid (after any discount).
      const refundedAmount = booking.total;
      const ticketsCount = booking.tickets.length;

      await tx.booking.update({
        where: { id: booking.id },
        data: { status: BookingStatus.REFUNDED },
      });
      await tx.ticket.updateMany({
        where: { bookingId: booking.id },
        data: { status: TicketStatus.REFUNDED },
      });
      // Only successful payments become refunds; leave FAILED/PENDING untouched.
      await tx.payment.updateMany({
        where: { bookingId: booking.id, status: PaymentStatus.SUCCEEDED },
        data: {
          status: PaymentStatus.REFUNDED,
          refundedAmount,
          refundedAt: now,
          refundReason: `Refund issued by admin: booking ${bookingId}`,
        },
      });

      // Free the seats: delete the exact ShowSeat rows for this booking's seats.
      // Deleting (not flipping to AVAILABLE) matches the seat-state convention.
      if (booking.tickets.length > 0) {
        await tx.showSeat.deleteMany({
          where: {
            showId: booking.showId,
            OR: booking.tickets.map((t) => ({
              zoneId: t.zoneId,
              row: t.row,
              seat: t.seat,
            })),
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId,
          action: "REFUND_BOOKING",
          entityType: "Booking",
          entityId: bookingId,
          details: {
            bookingId,
            showId: booking.showId,
            eventId: booking.show.eventId,
            customerPhone: booking.customerPhone,
            refundedAmount,
            ticketsCount,
            refundedSeats: booking.tickets.map((t) => ({
              zoneId: t.zoneId,
              row: t.row,
              seat: t.seat,
            })),
          },
        },
      });

      return {
        kind: "ok",
        showId: booking.showId,
        eventId: booking.show.eventId,
        summary: { refundedAmount, ticketsCount },
      } as const;
    });
  } catch {
    // Don't leak internal Prisma errors to the client.
    return {
      ok: false,
      error: "Не удалось оформить возврат. Попробуйте ещё раз.",
    };
  }

  if (outcome.kind === "not_found") {
    return { ok: false, error: "Бронь не найдена" };
  }
  if (outcome.kind === "already") {
    return { ok: false, error: "Возврат уже оформлен" };
  }
  if (outcome.kind === "not_paid") {
    return { ok: false, error: "Можно вернуть только оплаченные брони" };
  }

  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath(`/admin/events/${outcome.eventId}`);
  // Seats are AVAILABLE again on the public seat map.
  for (const loc of LOCALES) {
    revalidatePath(`/${loc}/shows/${outcome.showId}/seats`);
  }

  return { ok: true, summary: outcome.summary };
}
