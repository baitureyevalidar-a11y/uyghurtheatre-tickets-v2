import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

/**
 * Cart lookups shared by the Header (cart dot) and the cart page.
 *
 * NOTE: `holdSessionId` lives on ShowSeat, NOT on Booking — so a guest's active
 * cart is found by tracing the session's HELD seats back to their PENDING
 * booking (Booking has no session column; the only link is showId + the held
 * seats this session owns).
 */

const pendingInclude = {
  show: { include: { event: true } },
} satisfies Prisma.BookingInclude;

const paidInclude = {
  show: { include: { event: true } },
  tickets: { orderBy: [{ zoneId: "asc" }, { row: "asc" }, { seat: "asc" }] },
} satisfies Prisma.BookingInclude;

export type PendingBooking = Prisma.BookingGetPayload<{
  include: typeof pendingInclude;
}>;
export type PaidBooking = Prisma.BookingGetPayload<{
  include: typeof paidInclude;
}>;

export type HeldSeat = { zoneId: string; row: number; seat: number };

export type PendingBookingResult = {
  booking: PendingBooking;
  heldSeats: HeldSeat[];
} | null;

/**
 * The session's active (non-expired) PENDING booking, if any, plus the seats it
 * currently holds. Returns null when there's no session or no live hold.
 */
export async function getActivePendingBooking(
  sessionId: string | undefined,
): Promise<PendingBookingResult> {
  if (!sessionId) return null;
  const now = new Date();

  const held = await db.showSeat.findMany({
    where: {
      holdSessionId: sessionId,
      status: "HELD",
      holdExpiresAt: { gt: now },
    },
    select: { showId: true, zoneId: true, row: true, seat: true },
    orderBy: [{ zoneId: "asc" }, { row: "asc" }, { seat: "asc" }],
  });
  if (held.length === 0) return null;

  const showIds = [...new Set(held.map((s) => s.showId))];
  const booking = await db.booking.findFirst({
    where: {
      showId: { in: showIds },
      status: "PENDING",
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: "desc" },
    include: pendingInclude,
  });
  if (!booking) return null;

  const heldSeats: HeldSeat[] = held
    .filter((s) => s.showId === booking.showId)
    .map(({ zoneId, row, seat }) => ({ zoneId, row, seat }));

  return { booking, heldSeats };
}

/** Cheap boolean for the Header cart dot. */
export async function hasActivePendingBooking(
  sessionId: string | undefined,
): Promise<boolean> {
  return (await getActivePendingBooking(sessionId)) !== null;
}

/**
 * PAID bookings the current browser owns (ids come from `booking_<id>` cookies).
 * Excludes REFUNDED (status must be PAID) and bookings whose show was CANCELLED.
 * Past shows are kept — the cart page splits upcoming vs past for ticket history.
 */
export async function getOwnedPaidBookings(
  bookingIds: string[],
): Promise<PaidBooking[]> {
  if (bookingIds.length === 0) return [];
  return db.booking.findMany({
    where: {
      id: { in: bookingIds },
      status: "PAID",
      show: { status: { not: "CANCELLED" } },
    },
    include: paidInclude,
    orderBy: { show: { startsAt: "asc" } },
  });
}
