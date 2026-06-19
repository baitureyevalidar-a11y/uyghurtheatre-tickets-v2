"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  BookingStatus,
  PaymentStatus,
  Prisma,
  ShowStatus,
  TicketStatus,
  UserRole,
} from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  ageRatingToDb,
  updateEventSchema,
  type ActionResult,
  type CancelSummary,
  type UpdateEventInput,
} from "@/lib/validation/event";

const LOCALES = ["ru", "kz", "ug"] as const;

function emptyToNull(s: string | null | undefined): string | null {
  return s && s.trim() !== "" ? s : null;
}

async function isAdmin(): Promise<boolean> {
  const role = (await auth())?.user?.role;
  return role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
}

// Thrown inside the transaction to abort + surface a sales-constraint violation.
class ShowConstraintError extends Error {}

export async function updateEventAction(
  id: string,
  input: UpdateEventInput,
): Promise<ActionResult> {
  if (!(await isAdmin())) return { ok: false, error: "Недостаточно прав" };

  const parsed = updateEventSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Проверьте корректность полей" };
  }
  const data = parsed.data;

  try {
    const result = await db.$transaction(async (tx) => {
      // Re-fetch server truth INSIDE the transaction — ticket counts can change
      // between page load and submit; never trust the client's view.
      const existing = await tx.event.findUnique({
        where: { id },
        include: { shows: { select: { id: true } } },
      });
      if (!existing) {
        return { ok: false as const, error: "Событие не найдено" };
      }

      const existingIds = new Set(existing.shows.map((s) => s.id));
      const ticketCounts = new Map<string, number>();
      for (const sid of existingIds) {
        ticketCounts.set(
          sid,
          await tx.ticket.count({ where: { showId: sid } }),
        );
      }

      const incomingIds = new Set(
        data.shows.filter((s) => s.id).map((s) => s.id as string),
      );

      // 1. Deletions: existing shows dropped from the form.
      for (const sid of existingIds) {
        if (incomingIds.has(sid)) continue;
        if ((ticketCounts.get(sid) ?? 0) > 0) {
          throw new ShowConstraintError("Нельзя удалить показ с продажами");
        }
        await tx.show.delete({ where: { id: sid } });
      }

      // 2. Inserts + updates.
      for (const s of data.shows) {
        const isExisting = s.id && existingIds.has(s.id);
        if (isExisting) {
          // Locked show (has sales): ignore all field changes.
          if ((ticketCounts.get(s.id as string) ?? 0) > 0) continue;
          // Deliberately NOT touching `status` — never republish a show the
          // admin may have manually drafted; only edit the form-owned fields.
          await tx.show.update({
            where: { id: s.id },
            data: {
              startsAt: new Date(s.startsAt),
              pricePremium: s.pricePremium,
              priceStandard: s.priceStandard,
              priceEconomy: s.priceEconomy,
              priceBalcony: s.priceBalcony,
            },
          });
        } else {
          await tx.show.create({
            data: {
              eventId: id,
              startsAt: new Date(s.startsAt),
              // New shows publish immediately (matches createEventAction).
              status: ShowStatus.ON_SALE,
              pricePremium: s.pricePremium,
              priceStandard: s.priceStandard,
              priceEconomy: s.priceEconomy,
              priceBalcony: s.priceBalcony,
            },
          });
        }
      }

      // 3. Event metadata.
      await tx.event.update({
        where: { id },
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
        },
      });

      return { ok: true as const };
    });

    if (!result.ok) return result;
  } catch (e) {
    if (e instanceof ShowConstraintError) {
      return { ok: false, error: e.message };
    }
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return { ok: false, error: "Slug уже занят" };
    }
    throw e;
  }

  redirect(`/admin/events/${id}`);
}

export async function deleteEventAction(id: string): Promise<ActionResult> {
  if (!(await isAdmin())) return { ok: false, error: "Недостаточно прав" };

  // Re-fetch with ticket counts — a booking could have landed since page load.
  const ticketCount = await db.ticket.count({
    where: { show: { eventId: id } },
  });
  if (ticketCount > 0) {
    return {
      ok: false,
      error: "Есть проданные билеты, отменяйте показы отдельно",
    };
  }

  try {
    // Shows cascade-delete via the FK relation.
    await db.event.delete({ where: { id } });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2025"
    ) {
      return { ok: false, error: "Событие не найдено" };
    }
    throw e;
  }

  redirect("/admin/events");
}

export async function cancelShowAction(showId: string): Promise<ActionResult> {
  // Defensive auth: actions can be invoked directly, not only via the gated UI.
  const session = await auth();
  const userId = session?.user?.id;
  const role = session?.user?.role;
  if (!userId || (role !== UserRole.ADMIN && role !== UserRole.SUPER_ADMIN)) {
    return { ok: false, error: "Недостаточно прав" };
  }

  type Outcome =
    | { kind: "not_found" }
    | { kind: "already" }
    | { kind: "ok"; eventId: string; eventSlug: string; summary: CancelSummary };

  let outcome: Outcome;
  try {
    outcome = await db.$transaction(async (tx) => {
      const show = await tx.show.findUnique({
        where: { id: showId },
        include: {
          event: { select: { id: true, slug: true } },
          bookings: { include: { tickets: true, payments: true } },
        },
      });
      if (!show) return { kind: "not_found" } as const;
      if (show.status === ShowStatus.CANCELLED) {
        return { kind: "already" } as const;
      }

      await tx.show.update({
        where: { id: showId },
        data: { status: ShowStatus.CANCELLED },
      });

      const now = new Date();
      let cancelledBookings = 0;
      let refundedTickets = 0;
      let refundedAmount = 0;

      for (const booking of show.bookings) {
        if (booking.status === BookingStatus.PAID) {
          cancelledBookings += 1;
          refundedTickets += booking.tickets.length;
          // Refund amount uses the snapshotted ticket prices, not the live show price.
          refundedAmount += booking.tickets.reduce((sum, t) => sum + t.price, 0);

          await tx.booking.update({
            where: { id: booking.id },
            data: { status: BookingStatus.REFUNDED },
          });
          await tx.ticket.updateMany({
            where: { bookingId: booking.id },
            data: { status: TicketStatus.REFUNDED },
          });
          // DB-only refund stub — real Kaspi/Epay API calls land in Session 10.
          await tx.payment.updateMany({
            where: { bookingId: booking.id },
            data: {
              status: PaymentStatus.REFUNDED,
              refundedAt: now,
              refundReason: `Show cancelled by admin: ${showId}`,
            },
          });
        } else if (booking.status === BookingStatus.PENDING) {
          // Abandon in-flight carts so the race-loser can't pay a dead show.
          await tx.booking.update({
            where: { id: booking.id },
            data: { status: BookingStatus.EXPIRED },
          });
        }
      }

      // CANCELLED status blocks new bookings — freeing the seat rows is hygiene.
      await tx.showSeat.deleteMany({ where: { showId } });

      // First real AuditLog usage. NB: schema fields are userId/entityType/
      // entityId/details (not actorId/targetType/targetId/payload). Payload is
      // rich enough for Session 8 to backfill customer notifications.
      await tx.auditLog.create({
        data: {
          userId,
          action: "CANCEL_SHOW",
          entityType: "Show",
          entityId: showId,
          details: {
            showId,
            eventId: show.event.id,
            startsAt: show.startsAt.toISOString(),
            cancelledBookings,
            refundedTickets,
            refundedAmount,
          },
        },
      });

      return {
        kind: "ok",
        eventId: show.event.id,
        eventSlug: show.event.slug,
        summary: { cancelledBookings, refundedTickets, refundedAmount },
      } as const;
    });
  } catch {
    // Don't leak internal Prisma errors to the client.
    return { ok: false, error: "Не удалось отменить показ. Попробуйте ещё раз." };
  }

  if (outcome.kind === "not_found") return { ok: false, error: "Показ не найден" };
  if (outcome.kind === "already") {
    return { ok: false, error: "Показ уже отменён" };
  }

  revalidatePath(`/admin/events/${outcome.eventId}`);
  revalidatePath("/admin/events");
  for (const loc of LOCALES) {
    revalidatePath(`/${loc}/events/${outcome.eventSlug}`);
  }

  return { ok: true, summary: outcome.summary };
}
