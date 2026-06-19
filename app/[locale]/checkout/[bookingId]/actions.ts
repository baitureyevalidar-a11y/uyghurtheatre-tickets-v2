"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import {
  BookingStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  SeatStatus,
  TicketStatus,
} from "@prisma/client";
import { db } from "@/lib/db";
import { getOrCreateSessionId } from "@/lib/session";
import { HALL_CONFIG, getRowTier, type TierId } from "@/lib/hall-config";
import {
  generateQrPayload,
  generateTicketCode,
} from "@/lib/tickets";

const Input = z.object({
  bookingId: z.string().min(1),
  customerName: z.string().min(2),
  customerPhone: z.string().regex(/^\+?7\d{10}$/),
  customerEmail: z.string().email().optional().or(z.literal("")),
  paymentMethod: z.enum(["KASPI_PAY", "EPAY_KZ"]),
  locale: z.enum(["ru", "kz", "ug"]),
});

export type CompleteResult = { error: string };

export async function completeBookingAction(
  raw: unknown,
): Promise<CompleteResult | void> {
  const input = Input.parse(raw);
  const t = await getTranslations({
    locale: input.locale,
    namespace: "checkout.errors",
  });

  const booking = await db.booking.findUnique({
    where: { id: input.bookingId },
    include: { show: true },
  });
  if (!booking) return { error: t("alreadyProcessed") };
  if (booking.status !== "PENDING") return { error: t("alreadyProcessed") };
  if (booking.expiresAt && booking.expiresAt < new Date()) {
    return { error: t("expired") };
  }

  const sessionId = await getOrCreateSessionId();
  const heldSeats = await db.showSeat.findMany({
    where: {
      showId: booking.showId,
      holdSessionId: sessionId,
      status: "HELD",
    },
  });
  if (heldSeats.length === 0) return { error: t("noHeldSeats") };

  const tierPrice: Record<TierId, number> = {
    premium: booking.show.pricePremium,
    standard: booking.show.priceStandard,
    economy: booking.show.priceEconomy,
    balcony: booking.show.priceBalcony,
  };

  // Pre-compute ticket data outside the transaction (signing is async).
  const ticketRows = await Promise.all(
    heldSeats.map(async (seat) => {
      const tier = getRowTier(seat.zoneId, seat.row);
      if (!tier) throw new Error(`Unknown tier for ${seat.zoneId} r${seat.row}`);
      const zone = HALL_CONFIG.find((z) => z.id === seat.zoneId);
      const zoneName = zone?.name[input.locale] ?? seat.zoneId;
      const ticketCode = generateTicketCode();
      const qrPayload = await generateQrPayload({
        ticketCode,
        bookingId: booking.id,
        showId: booking.showId,
      });
      return {
        seatId: seat.id,
        zoneId: seat.zoneId,
        zoneName,
        row: seat.row,
        seat: seat.seat,
        tier,
        price: tierPrice[tier],
        ticketCode,
        qrPayload,
      };
    }),
  );

  try {
    await db.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          customerEmail: input.customerEmail || null,
          status: BookingStatus.PAID,
          expiresAt: null,
        },
      });

      await tx.payment.create({
        data: {
          bookingId: booking.id,
          amount: booking.total,
          method: input.paymentMethod as PaymentMethod,
          status: PaymentStatus.SUCCEEDED,
          providerTransactionId: `stub_${Date.now()}`,
        },
      });

      for (const row of ticketRows) {
        const ticket = await tx.ticket.create({
          data: {
            bookingId: booking.id,
            showId: booking.showId,
            zoneId: row.zoneId,
            zoneName: row.zoneName,
            row: row.row,
            seat: row.seat,
            tier: row.tier,
            price: row.price,
            ticketCode: row.ticketCode,
            qrPayload: row.qrPayload,
            status: TicketStatus.VALID,
          },
        });
        await tx.showSeat.update({
          where: { id: row.seatId },
          data: {
            status: SeatStatus.BOOKED,
            holdExpiresAt: null,
            holdSessionId: null,
            ticketId: ticket.id,
          },
        });
      }
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      return { error: t("generic") };
    }
    throw e;
  }

  // Grant the current browser access to the success page (post-payment, the
  // ShowSeat.holdSessionId is cleared so we lose the original ownership link).
  const store = await cookies();
  store.set(`booking_${booking.id}`, "owner", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  redirect(`/${input.locale}/checkout/${input.bookingId}/success`);
}
