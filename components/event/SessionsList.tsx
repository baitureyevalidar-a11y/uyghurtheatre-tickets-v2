"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export type SessionRow = {
  id: string;
  time: string;
  priceLabel: string;
};

export type SessionGroup = {
  id: string;
  dateLabel: string;
  weekdayLabel: string;
  rows: SessionRow[];
};

/**
 * Garnet "buy from" CTA that smooth-scrolls to the sessions card (#sessions).
 * Client-only so it can scroll; disabled state has no scroll target.
 */
export function BuyFromCta({
  label,
  disabled,
}: {
  label: string;
  disabled: boolean;
}) {
  const scrollToSessions = () => {
    document
      .getElementById("sessions")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <button
      type="button"
      onClick={disabled ? undefined : scrollToSessions}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center rounded-md px-8 py-4 text-base font-semibold shadow-cta transition-colors",
        disabled
          ? "cursor-not-allowed bg-ink-soft/40 text-white shadow-none"
          : "bg-garnet text-white hover:bg-garnet-dark",
      )}
    >
      {label}
    </button>
  );
}

/**
 * Sessions grouped by date. Each date group is an independent client-side
 * collapsible; the first group is expanded by default. Server pre-formats all
 * labels (locale-aware) — this component only owns the open/closed state.
 */
export function SessionsList({
  groups,
  emptyLabel,
}: {
  groups: SessionGroup[];
  emptyLabel: string;
}) {
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(groups.map((g, i) => [g.id, i === 0])),
  );

  if (groups.length === 0) {
    return <p className="py-8 text-center text-ink-soft">{emptyLabel}</p>;
  }

  return (
    <div className="flex flex-col">
      {groups.map((g) => {
        const isOpen = open[g.id] ?? false;
        return (
          <div key={g.id} className="border-b border-line last:border-b-0">
            <button
              type="button"
              onClick={() => setOpen((p) => ({ ...p, [g.id]: !p[g.id] }))}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 py-5 text-left"
            >
              <span className="font-serif text-xl md:text-2xl">
                <span className="font-bold text-ink">{g.dateLabel}</span>
                <span className="text-ink-soft">, {g.weekdayLabel}</span>
              </span>
              <ChevronDown
                className={cn(
                  "h-5 w-5 shrink-0 text-ink-soft transition-transform duration-200",
                  isOpen && "rotate-180",
                )}
                aria-hidden
              />
            </button>

            {isOpen && (
              <div className="border-t border-line">
                {g.rows.map((r, i) => (
                  <div
                    key={r.id}
                    className={cn(
                      "flex flex-wrap items-center gap-2 py-4 md:gap-4",
                      i < g.rows.length - 1 && "border-b border-line",
                    )}
                  >
                    <span className="rounded-md border border-line px-3 py-1 text-base font-medium tabular-nums text-ink md:px-4 md:py-2 md:text-lg">
                      {r.time}
                    </span>
                    <span className="flex-1" />
                    <Link
                      href={`/shows/${r.id}/seats`}
                      className="inline-flex items-center justify-center rounded-md bg-garnet px-3 py-1.5 text-sm font-semibold text-white shadow-cta transition-colors hover:bg-garnet-dark md:px-5 md:py-2 md:text-base"
                    >
                      {r.priceLabel}
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
