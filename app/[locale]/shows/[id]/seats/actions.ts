"use server";

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getOrCreateSessionId } from "@/lib/session";
import { getRowTier, TIER_LABELS, type TierId } from "@/lib/hall-config";

const HOLD_MINUTES = 10;
const MAX_SEATS = 10;

const Input = z.object({
  showId: z.string().min(1),
  locale: z.enum(["ru", "kz", "ug"]),
  seats: z
    .array(
      z.object({
        zoneId: z.string().min(1),
        row: z.number().int().positive(),
        seat: z.number().int().positive(),
      }),
    )
    .min(1)
    .max(MAX_SEATS),
});

export type HoldResult = { error: string };

export async function holdSeatsAction(raw: unknown): Promise<HoldResult | void> {
  const input = Input.parse(raw);
  const t = await getTranslations({ locale: input.locale, namespace: "seats" });

  const show = await db.show.findUnique({ where: { id: input.showId } });
  if (!show || show.status !== "ON_SALE") {
    return { error: t("errorShowUnavailable") };
  }

  const tierPriceMap: Record<TierId, number> = {
    premium: show.pricePremium,
    standard: show.priceStandard,
    economy: show.priceEconomy,
    balcony: show.priceBalcony,
  };

  let subtotal = 0;
  const seatRows: Array<{
    zoneId: string;
    row: number;
    seat: number;
    tier: TierId;
    tierLabel: string;
    price: number;
  }> = [];
  for (const s of input.seats) {
    const tier = getRowTier(s.zoneId, s.row);
    if (!tier) return { error: t("errorInvalidSeat") };
    const price = tierPriceMap[tier];
    subtotal += price;
    seatRows.push({
      ...s,
      tier,
      tierLabel: TIER_LABELS[tier][input.locale],
      price,
    });
  }

  const sessionId = await getOrCreateSessionId();
  const expiresAt = new Date(Date.now() + HOLD_MINUTES * 60 * 1000);

  let bookingId: string;
  try {
    bookingId = await db.$transaction(async (tx) => {
      // Unique constraint on (showId, zoneId, row, seat) makes concurrent holds
      // mutually exclusive — second writer hits P2002 and we surface that.
      for (const s of seatRows) {
        await tx.showSeat.create({
          data: {
            showId: input.showId,
            zoneId: s.zoneId,
            row: s.row,
            seat: s.seat,
            status: "HELD",
            holdExpiresAt: expiresAt,
            holdSessionId: sessionId,
          },
        });
      }
      const booking = await tx.booking.create({
        data: {
          showId: input.showId,
          customerName: "",
          customerPhone: "",
          subtotal,
          total: subtotal,
          status: "PENDING",
          expiresAt,
          locale: input.locale,
          source: "WEB",
        },
      });
      return booking.id;
    });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return { error: t("errorSeatTaken") };
    }
    throw e;
  }

  // Redirect throws NEXT_REDIRECT — MUST be outside the try/catch above so it
  // isn't swallowed as a "transaction error".
  redirect(`/${input.locale}/checkout/${bookingId}`);
}
