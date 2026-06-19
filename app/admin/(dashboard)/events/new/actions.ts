"use server";

import { redirect } from "next/navigation";
import { Prisma, ShowStatus, UserRole } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  ageRatingToDb,
  createEventSchema,
  type ActionResult,
  type CreateEventInput,
} from "@/lib/validation/event";

function emptyToNull(s: string | null | undefined): string | null {
  return s && s.trim() !== "" ? s : null;
}

async function isAdmin(): Promise<boolean> {
  const role = (await auth())?.user?.role;
  return role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
}

export async function createEventAction(
  input: CreateEventInput,
): Promise<ActionResult> {
  if (!(await isAdmin())) return { ok: false, error: "Недостаточно прав" };

  const parsed = createEventSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Проверьте корректность полей" };
  }
  const data = parsed.data;

  let eventId: string;
  try {
    const event = await db.$transaction((tx) =>
      tx.event.create({
        data: {
          slug: data.slug,
          titleRu: data.titleRu,
          titleKz: data.titleKz,
          titleUg: data.titleUg,
          descriptionRu: emptyToNull(data.descriptionRu),
          descriptionKz: emptyToNull(data.descriptionKz),
          descriptionUg: emptyToNull(data.descriptionUg),
          genre: emptyToNull(data.genre),
          cast: data.cast,
          director: emptyToNull(data.director),
          ageRating: ageRatingToDb(data.ageRating),
          durationMin: data.durationMin,
          posterUrl: data.posterUrl,
          shows: {
            create: data.shows.map((s) => ({
              startsAt: new Date(s.startsAt),
              // Admin UI has no status control yet — publish immediately so
              // the show is visible + buyable (schema default DRAFT would hide it).
              status: ShowStatus.ON_SALE,
              pricePremium: s.pricePremium,
              priceStandard: s.priceStandard,
              priceEconomy: s.priceEconomy,
              priceBalcony: s.priceBalcony,
            })),
          },
        },
        select: { id: true },
      }),
    );
    eventId = event.id;
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return { ok: false, error: "Slug уже занят" };
    }
    throw e;
  }

  // Outside try/catch: redirect throws NEXT_REDIRECT and must not be swallowed.
  redirect(`/admin/events/${eventId}`);
}
