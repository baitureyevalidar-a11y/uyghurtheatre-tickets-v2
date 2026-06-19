import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { BookingsFilters } from "@/components/admin/BookingsFilters";
import {
  BookingsTable,
  type BookingRow,
} from "@/components/admin/BookingsTable";
import { Pagination } from "@/components/admin/Pagination";
import {
  PAGE_SIZE,
  bookingFiltersSchema,
  hasActiveFilters,
} from "@/lib/validation/booking";

export const metadata = { title: "Брони — Админка" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Parse "YYYY-MM-DD" as a local date; returns null for blank/invalid input. */
function parseDate(value: string, endOfDay: boolean): Date | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  if (endOfDay) d.setHours(23, 59, 59, 999);
  else d.setHours(0, 0, 0, 0);
  return d;
}

export default async function BookingsListPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const raw = await searchParams;
  const filters = bookingFiltersSchema.parse(raw);

  // ── Build the Prisma where clause from the active filters ──
  const where: Prisma.BookingWhereInput = {};
  const and: Prisma.BookingWhereInput[] = [];

  const q = filters.q.trim();
  if (q) {
    const digits = q.replace(/\D/g, "");
    const or: Prisma.BookingWhereInput[] = [
      { customerEmail: { contains: q, mode: "insensitive" } },
      { customerPhone: { contains: q } },
      { id: { contains: q } },
      { tickets: { some: { ticketCode: { contains: q, mode: "insensitive" } } } },
    ];
    // Phone pasted with formatting (+7, spaces, dashes) → match on bare digits.
    if (digits && digits !== q) or.push({ customerPhone: { contains: digits } });
    and.push({ OR: or });
  }

  if (filters.status !== "ALL") where.status = filters.status;
  if (filters.eventId) where.show = { eventId: filters.eventId };

  const from = parseDate(filters.dateFrom, false);
  const to = parseDate(filters.dateTo, true);
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = from;
    if (to) where.createdAt.lte = to;
  }
  if (and.length > 0) where.AND = and;

  const skip = (filters.page - 1) * PAGE_SIZE;

  const [total, bookings, events] = await Promise.all([
    db.booking.count({ where }),
    db.booking.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
      select: {
        id: true,
        customerName: true,
        customerPhone: true,
        status: true,
        total: true,
        createdAt: true,
        _count: { select: { tickets: true } },
        show: {
          select: { startsAt: true, event: { select: { titleRu: true } } },
        },
      },
    }),
    db.event.findMany({
      orderBy: { titleRu: "asc" },
      select: { id: true, titleRu: true },
    }),
  ]);

  const rows: BookingRow[] = bookings.map((b) => ({
    id: b.id,
    customerName: b.customerName,
    customerPhone: b.customerPhone,
    status: b.status,
    total: b.total,
    ticketsCount: b._count.tickets,
    createdAt: b.createdAt,
    eventTitleRu: b.show.event.titleRu,
    showStartsAt: b.show.startsAt,
  }));

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const active = hasActiveFilters(filters);

  return (
    <div className="max-w-6xl space-y-5">
      <div className="flex items-baseline justify-between">
        <h1 className="font-display text-3xl font-medium text-text-primary">
          Брони
        </h1>
        <span className="text-sm text-text-secondary tabular-nums">
          Всего: {total}
        </span>
      </div>

      <BookingsFilters events={events} />
      <BookingsTable rows={rows} hasActiveFilters={active} />
      <Pagination current={filters.page} totalPages={totalPages} />
    </div>
  );
}
