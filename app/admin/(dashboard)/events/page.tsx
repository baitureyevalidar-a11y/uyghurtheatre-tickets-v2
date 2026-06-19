import Link from "next/link";
import Image from "next/image";
import { CalendarPlus, ImageOff, Pencil } from "lucide-react";
import { db } from "@/lib/db";
import { DeleteEventButton } from "@/components/admin/DeleteEventButton";
import { deleteEventAction } from "./[id]/actions";

export const metadata = { title: "События — Админка" };

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

export default async function EventsListPage() {
  const events = await db.event.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      titleRu: true,
      genre: true,
      posterUrl: true,
      createdAt: true,
      shows: {
        select: {
          id: true,
          startsAt: true,
          _count: { select: { tickets: true } },
        },
      },
    },
  });

  const now = Date.now();
  const rows = events.map((e) => ({
    ...e,
    totalShows: e.shows.length,
    upcomingShows: e.shows.filter((s) => s.startsAt.getTime() > now).length,
    ticketsSold: e.shows.reduce((sum, s) => sum + s._count.tickets, 0),
  }));

  return (
    <div className="max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl font-medium text-text-primary">
          События
        </h1>
        <Link
          href="/admin/events/new"
          className="inline-flex h-10 items-center gap-2 rounded-md bg-brand-teal px-4 text-sm font-medium text-white transition-colors hover:bg-brand-teal-dark"
        >
          <CalendarPlus className="h-4 w-4" aria-hidden />
          Новое событие
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border-default bg-bg-surface py-20">
          <p className="text-text-secondary">Событий пока нет</p>
          <Link
            href="/admin/events/new"
            className="inline-flex h-11 items-center gap-2 rounded-md bg-brand-teal px-6 text-sm font-medium text-white transition-colors hover:bg-brand-teal-dark"
          >
            <CalendarPlus className="h-4 w-4" aria-hidden />
            Создать первое событие
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border-default bg-bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-default text-left text-xs font-medium tracking-wide text-text-secondary uppercase">
                <th className="px-4 py-3 font-medium">Постер</th>
                <th className="px-4 py-3 font-medium">Название</th>
                <th className="px-4 py-3 font-medium">Жанр</th>
                <th className="px-4 py-3 font-medium">Показов</th>
                <th className="px-4 py-3 font-medium">Продано</th>
                <th className="px-4 py-3 font-medium">Создано</th>
                <th className="px-4 py-3 font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr
                  key={e.id}
                  className="border-b border-border-subtle last:border-0"
                >
                  <td className="px-4 py-3">
                    <div className="relative h-20 w-[60px] overflow-hidden rounded-sm border border-border-default bg-bg-elevated">
                      {e.posterUrl ? (
                        <Image
                          src={e.posterUrl}
                          alt=""
                          fill
                          sizes="60px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-text-tertiary">
                          <ImageOff className="h-5 w-5" aria-hidden />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/events/${e.id}`}
                      className="font-medium text-text-primary hover:text-brand-teal"
                    >
                      {e.titleRu}
                    </Link>
                    <div className="font-mono text-xs text-text-tertiary">
                      {e.slug}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {e.genre ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {e.totalShows}
                    <span className="text-text-tertiary">
                      {" "}
                      / {e.upcomingShows}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {e.ticketsSold}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {formatDate(e.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/admin/events/${e.id}`}
                        aria-label="Редактировать"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-bg-elevated hover:text-brand-teal"
                      >
                        <Pencil className="h-4 w-4" aria-hidden />
                      </Link>
                      <DeleteEventButton
                        action={deleteEventAction.bind(null, e.id)}
                        disabled={e.ticketsSold > 0}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
