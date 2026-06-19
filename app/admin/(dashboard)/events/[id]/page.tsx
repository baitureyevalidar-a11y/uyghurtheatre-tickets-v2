import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { EventForm, type EventWithShows } from "@/components/admin/EventForm";
import {
  cancelShowAction,
  deleteEventAction,
  updateEventAction,
} from "./actions";

export const metadata = { title: "Редактирование события — Админка" };

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const event = await db.event.findUnique({
    where: { id },
    include: { shows: { orderBy: { startsAt: "asc" } } },
  });
  if (!event) notFound();

  // One grouped query for both the ticket count and the refundable amount
  // (sum of snapshotted ticket prices) per show — drives locked/cancel UI.
  const showIds = event.shows.map((s) => s.id);
  const ticketAgg = await db.ticket.groupBy({
    by: ["showId"],
    where: { showId: { in: showIds } },
    _count: { _all: true },
    _sum: { price: true },
  });
  const aggByShow = new Map(
    ticketAgg.map((g) => [
      g.showId,
      { count: g._count._all, amount: g._sum.price ?? 0 },
    ]),
  );

  const shows = event.shows.map((s) => ({
    id: s.id,
    status: s.status,
    startsAt: s.startsAt,
    pricePremium: s.pricePremium,
    priceStandard: s.priceStandard,
    priceEconomy: s.priceEconomy,
    priceBalcony: s.priceBalcony,
    ticketCount: aggByShow.get(s.id)?.count ?? 0,
    totalAmount: aggByShow.get(s.id)?.amount ?? 0,
  }));

  const shaped: EventWithShows = {
    id: event.id,
    slug: event.slug,
    titleRu: event.titleRu,
    titleKz: event.titleKz,
    titleUg: event.titleUg,
    descriptionRu: event.descriptionRu,
    descriptionKz: event.descriptionKz,
    descriptionUg: event.descriptionUg,
    genre: event.genre,
    cast: event.cast,
    director: event.director,
    ageRating: event.ageRating,
    durationMin: event.durationMin,
    posterUrl: event.posterUrl,
    shows,
  };

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 font-display text-3xl font-medium text-text-primary">
        Редактирование — {event.titleRu}
      </h1>
      <EventForm
        mode="edit"
        event={shaped}
        onSubmitAction={updateEventAction.bind(null, event.id)}
        onDeleteAction={deleteEventAction.bind(null, event.id)}
        onCancelShowAction={cancelShowAction}
      />
    </div>
  );
}
