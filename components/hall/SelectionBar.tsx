"use client";

import { useTranslations } from "next-intl";
import { Container } from "@/components/layout/Container";
import { formatPrice, type AppLocale } from "@/lib/format";

export type SelectionBarSeat = {
  zoneName: string;
  row: number;
  seat: number;
};

type SelectionBarProps = {
  selectedCount: number;
  totalPrice: number;
  seats: SelectionBarSeat[];
  onContinue: () => void;
  isPending: boolean;
  error: string | null;
  locale: AppLocale;
  /** Prompt shown in the empty state — varies by view (sector vs seat). */
  emptyPrompt?: string;
};

export function SelectionBar({
  selectedCount,
  totalPrice,
  seats,
  onContinue,
  isPending,
  error,
  locale,
  emptyPrompt,
}: SelectionBarProps) {
  const t = useTranslations("seats");
  const hasSelection = selectedCount > 0;

  // Empty state — only the prompt line.
  if (!hasSelection && !error) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper-2/90 backdrop-blur">
        <Container className="py-4 text-center text-sm text-ink-soft">
          {emptyPrompt ?? t("selectNone")}
        </Container>
      </div>
    );
  }

  const seatSummary = seats
    .slice(0, 4)
    .map(
      (s) =>
        `${s.zoneName} ${t("rowLabel").toLowerCase()} ${s.row} ${t(
          "seatLabel",
        ).toLowerCase()} ${s.seat}`,
    )
    .join(", ");

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper-2/90 backdrop-blur">
      <Container className="py-4">
        {error && (
          <div className="mb-3 rounded-md bg-state-error-bg p-3 text-sm text-state-error">
            {error}
          </div>
        )}
        {hasSelection && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-ink">
                {t("countSeats", { count: selectedCount })}
                {" · "}
                {formatPrice(totalPrice, locale)}
              </div>
              <div className="mt-0.5 truncate text-xs text-ink-soft">
                {seatSummary}
                {seats.length > 4 && " …"}
              </div>
            </div>
            <button
              type="button"
              onClick={onContinue}
              disabled={isPending}
              className="inline-flex h-12 shrink-0 items-center justify-center rounded-md bg-garnet px-6 text-sm font-semibold text-white shadow-cta transition-colors duration-200 hover:bg-garnet-dark disabled:cursor-not-allowed disabled:bg-ink-soft disabled:shadow-none"
            >
              {isPending
                ? t("creatingBooking")
                : t("continueWithTotal", {
                    total: formatPrice(totalPrice, locale),
                  })}
            </button>
          </div>
        )}
      </Container>
    </div>
  );
}
