import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";

export default async function DashboardPage() {
  const session = await auth();

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - 7);

  const [eventsCount, todayBookings, weekTickets, weekRevenue] =
    await Promise.all([
      db.event.count({ where: { isActive: true } }),
      db.booking.count({
        where: { status: "PAID", createdAt: { gte: startOfToday } },
      }),
      db.ticket.count({
        where: { createdAt: { gte: startOfWeek }, status: "VALID" },
      }),
      db.booking.aggregate({
        _sum: { total: true },
        where: { status: "PAID", createdAt: { gte: startOfWeek } },
      }),
    ]);

  return (
    <div className="max-w-6xl">
      <h1 className="font-display text-3xl font-medium text-text-primary">
        Добро пожаловать, {session?.user.name}
      </h1>
      <p className="mt-2 text-text-secondary">
        Сводка по театру за последнее время
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Активных событий" value={eventsCount} />
        <StatCard label="Броней сегодня" value={todayBookings} />
        <StatCard label="Билетов за 7 дней" value={weekTickets} />
        <StatCard
          label="Выручка за 7 дней"
          value={formatPrice(weekRevenue._sum.total ?? 0, "ru")}
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg border border-border-default bg-bg-surface p-5">
      <div className="text-sm text-text-secondary">{label}</div>
      <div className="mt-2 font-display text-3xl font-medium text-text-primary">
        {value}
      </div>
    </div>
  );
}
