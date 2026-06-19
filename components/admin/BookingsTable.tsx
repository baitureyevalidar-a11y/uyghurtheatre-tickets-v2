import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { BookingStatus } from "@prisma/client";
import {
  formatPrice,
  formatRelativeDate,
  formatShowDate,
} from "@/lib/format";
import { CopyButton } from "./CopyButton";
import { BookingStatusBadge } from "./BookingStatusBadge";

export type BookingRow = {
  id: string;
  customerName: string;
  customerPhone: string;
  status: BookingStatus;
  total: number;
  ticketsCount: number;
  createdAt: Date;
  eventTitleRu: string;
  showStartsAt: Date;
};

type BookingsTableProps = {
  rows: BookingRow[];
  hasActiveFilters: boolean;
};

export function BookingsTable({ rows, hasActiveFilters }: BookingsTableProps) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border-default bg-bg-surface py-20">
        <p className="text-text-secondary">Брони не найдены</p>
        {hasActiveFilters && (
          <Link
            href="/admin/bookings"
            className="text-sm font-medium text-brand-teal hover:text-brand-teal-dark"
          >
            Сбросить фильтры
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border-default bg-bg-surface">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-default text-left text-xs font-medium tracking-wide text-text-secondary uppercase">
            <th className="px-4 py-3 font-medium">ID</th>
            <th className="px-4 py-3 font-medium">Клиент</th>
            <th className="px-4 py-3 font-medium">Показ</th>
            <th className="px-4 py-3 text-right font-medium">Билетов</th>
            <th className="px-4 py-3 text-right font-medium">Сумма</th>
            <th className="px-4 py-3 font-medium">Статус</th>
            <th className="px-4 py-3 font-medium">Создано</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {rows.map((b) => (
            <tr
              key={b.id}
              className="group border-b border-border-subtle last:border-0 hover:bg-bg-elevated"
            >
              <td className="px-4 py-3 align-top">
                <div className="flex items-center gap-1">
                  <span
                    className="font-mono text-xs text-text-secondary"
                    title={b.id}
                  >
                    {b.id.slice(0, 8)}
                  </span>
                  <span className="opacity-0 transition-opacity group-hover:opacity-100">
                    <CopyButton value={b.id} label="Скопировать ID брони" />
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 align-top">
                {b.customerName ? (
                  <>
                    <div className="font-medium text-text-primary">
                      {b.customerName}
                    </div>
                    <div className="text-xs text-text-tertiary">
                      {b.customerPhone}
                    </div>
                  </>
                ) : (
                  <div className="text-text-primary">{b.customerPhone}</div>
                )}
              </td>
              <td className="px-4 py-3 align-top">
                <div className="font-display text-text-primary">
                  {b.eventTitleRu}
                </div>
                <div className="text-xs text-text-tertiary">
                  {formatShowDate(b.showStartsAt, "ru")}
                </div>
              </td>
              <td className="px-4 py-3 text-right align-top tabular-nums text-text-secondary">
                {b.ticketsCount}
              </td>
              <td className="px-4 py-3 text-right align-top tabular-nums text-text-primary">
                {formatPrice(b.total, "ru")}
              </td>
              <td className="px-4 py-3 align-top">
                <BookingStatusBadge status={b.status} />
              </td>
              <td
                className="px-4 py-3 align-top whitespace-nowrap text-text-secondary"
                title={b.createdAt.toLocaleString("ru-RU")}
              >
                {formatRelativeDate(b.createdAt)}
              </td>
              <td className="px-4 py-3 align-top">
                <Link
                  href={`/admin/bookings/${b.id}`}
                  aria-label="Открыть бронь"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-bg-surface hover:text-brand-teal"
                >
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
