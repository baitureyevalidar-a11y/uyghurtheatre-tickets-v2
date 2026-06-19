"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import {
  BOOKING_STATUS_FILTERS,
  STATUS_FILTER_LABELS,
} from "@/lib/validation/booking";

type EventOption = { id: string; titleRu: string };

type BookingsFiltersProps = {
  events: EventOption[];
};

export function BookingsFilters({ events }: BookingsFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Local state for the search box so typing stays responsive while the URL
  // update is debounced. Other controls write the URL immediately.
  const [q, setQ] = useState(searchParams.get("q") ?? "");

  // Keep the input in sync when the URL changes externally (e.g. reset link).
  useEffect(() => {
    setQ(searchParams.get("q") ?? "");
  }, [searchParams]);

  const commit = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      // Any filter change resets to the first page.
      params.delete("page");
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setParam = useCallback(
    (key: string, value: string) => {
      commit((params) => {
        if (value) params.set(key, value);
        else params.delete(key);
      });
    },
    [commit],
  );

  // ── Debounced search (300ms) ──
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSearchChange = (value: string) => {
    setQ(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setParam("q", value.trim()), 300);
  };
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const status = searchParams.get("status") ?? "ALL";
  const dateFrom = searchParams.get("dateFrom") ?? "";
  const dateTo = searchParams.get("dateTo") ?? "";
  const eventId = searchParams.get("eventId") ?? "";

  const anyActive =
    q.trim() !== "" ||
    status !== "ALL" ||
    dateFrom !== "" ||
    dateTo !== "" ||
    eventId !== "";

  const reset = () => {
    setQ("");
    router.replace(pathname, { scroll: false });
  };

  const fieldClass =
    "h-10 rounded-md border border-border-default bg-bg-surface px-3 text-sm text-text-primary outline-none focus-visible:border-brand-teal";
  const labelClass = "text-xs font-medium text-text-secondary";

  return (
    <div className="rounded-lg border border-border-default bg-bg-surface p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor="bk-q" className={labelClass}>
            Поиск
          </label>
          <input
            id="bk-q"
            type="search"
            value={q}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Телефон, email, код билета или ID брони"
            className={fieldClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="bk-status" className={labelClass}>
            Статус
          </label>
          <select
            id="bk-status"
            value={status}
            onChange={(e) => setParam("status", e.target.value)}
            className={fieldClass}
          >
            {BOOKING_STATUS_FILTERS.map((s) => (
              <option key={s} value={s}>
                {STATUS_FILTER_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="bk-event" className={labelClass}>
            Событие
          </label>
          <select
            id="bk-event"
            value={eventId}
            onChange={(e) => setParam("eventId", e.target.value)}
            className={fieldClass}
          >
            <option value="">Все события</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.titleRu}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="bk-from" className={labelClass}>
            Создано от
          </label>
          <input
            id="bk-from"
            type="date"
            value={dateFrom}
            max={dateTo || undefined}
            onChange={(e) => setParam("dateFrom", e.target.value)}
            className={fieldClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="bk-to" className={labelClass}>
            Создано до
          </label>
          <input
            id="bk-to"
            type="date"
            value={dateTo}
            min={dateFrom || undefined}
            onChange={(e) => setParam("dateTo", e.target.value)}
            className={fieldClass}
          />
        </div>
      </div>

      {anyActive && (
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-brand-teal"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
            Сбросить
          </button>
        </div>
      )}
    </div>
  );
}
