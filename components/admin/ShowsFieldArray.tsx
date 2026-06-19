"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useFormContext } from "react-hook-form";
import { ShowStatus } from "@prisma/client";
import { Plus, X, Lock, Clock, Ban, CalendarX, CheckCircle2 } from "lucide-react";
import type { ActionResult, EventFormValues } from "@/lib/validation/event";
import { DEFAULT_SHOW_PRICES } from "@/lib/validation/event";
import { formatPrice } from "@/lib/format";
import { CancelShowDialog } from "./CancelShowDialog";

export type ShowMeta = {
  ticketCount: number;
  startsAt: Date;
  status: ShowStatus;
  totalAmount: number;
};

type ShowsFieldArrayProps = {
  /** Per-show server-truth metadata, keyed by show id (existing shows only). */
  showMeta: Map<string, ShowMeta>;
  /** Edit mode only: cancel a show + cascade refunds. */
  onCancelShow?: (showId: string) => Promise<ActionResult>;
};

type CancelTarget = {
  id: string;
  startsAt: Date;
  ticketsCount: number;
  totalAmount: number;
};

type Banner =
  | { kind: "success"; refundedTickets: number; refundedAmount: number }
  | { kind: "error"; text: string };

const PRICE_FIELDS = [
  { name: "pricePremium", label: "Премиум" },
  { name: "priceStandard", label: "Стандарт" },
  { name: "priceEconomy", label: "Эконом" },
  { name: "priceBalcony", label: "Балкон" },
] as const;

export function ShowsFieldArray({ showMeta, onCancelShow }: ShowsFieldArrayProps) {
  const router = useRouter();
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<EventFormValues>();

  const [cancelTarget, setCancelTarget] = useState<CancelTarget | null>(null);
  const [banner, setBanner] = useState<Banner | null>(null);

  // keyName avoids RHF clobbering our own `id` field (default keyName is "id").
  const { fields, append, remove } = useFieldArray({
    control,
    name: "shows",
    keyName: "_rhfId",
  });

  const rootError = errors.shows?.root?.message ?? errors.shows?.message;

  const handleConfirmCancel = async () => {
    if (!cancelTarget || !onCancelShow) return;
    const res = await onCancelShow(cancelTarget.id);
    setCancelTarget(null);
    if (res.ok) {
      setBanner({
        kind: "success",
        refundedTickets: res.summary?.refundedTickets ?? 0,
        refundedAmount: res.summary?.refundedAmount ?? 0,
      });
      // Re-pull server data so the card flips to its Cancelled state.
      router.refresh();
    } else {
      setBanner({ kind: "error", text: res.error });
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-medium text-text-primary">
          Показы
        </h2>
        <button
          type="button"
          onClick={() =>
            append({ id: undefined, startsAt: "", ...DEFAULT_SHOW_PRICES })
          }
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-brand-teal px-3 text-sm font-medium text-brand-teal transition-colors hover:bg-brand-beige"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Добавить показ
        </button>
      </div>

      {banner?.kind === "success" && (
        <div className="flex items-start gap-2 rounded-md bg-state-success-bg p-3 text-sm text-state-success">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>
            {banner.refundedTickets > 0
              ? `Показ отменён. Возвращено ${banner.refundedTickets} ${pluralBilet(
                  banner.refundedTickets,
                )} на сумму ${formatPrice(banner.refundedAmount, "ru")}.`
              : "Показ отменён. Проданных билетов не было."}
          </span>
        </div>
      )}
      {banner?.kind === "error" && (
        <p className="rounded-md bg-state-error-bg p-3 text-sm text-state-error">
          {banner.text}
        </p>
      )}

      {rootError && <p className="text-sm text-state-error">{rootError}</p>}

      {fields.length === 0 && (
        <p className="rounded-md border border-dashed border-border-default bg-bg-elevated p-6 text-center text-sm text-text-secondary">
          Показов нет. Добавьте хотя бы один.
        </p>
      )}

      <div className="space-y-3">
        {fields.map((field, index) => {
          const showId = field.id;
          const meta = showId ? showMeta.get(showId) : undefined;
          const ticketCount = meta?.ticketCount ?? 0;
          const isCancelled = meta?.status === ShowStatus.CANCELLED;
          const isLocked = !isCancelled && ticketCount > 0;
          const isPast =
            !isCancelled &&
            !isLocked &&
            !!meta &&
            meta.startsAt.getTime() < Date.now();
          const disabled = isCancelled || isLocked || isPast;
          const showErrors = errors.shows?.[index];

          return (
            <ShowCard
              key={field._rhfId}
              index={index}
              showId={showId}
              isCancelled={isCancelled}
              isLocked={isLocked}
              isPast={isPast}
              disabled={disabled}
              ticketCount={ticketCount}
              register={register}
              errors={showErrors}
              onRemove={() => remove(index)}
              onRequestCancel={
                showId && meta && onCancelShow
                  ? () => {
                      setBanner(null);
                      setCancelTarget({
                        id: showId,
                        startsAt: meta.startsAt,
                        ticketsCount: meta.ticketCount,
                        totalAmount: meta.totalAmount,
                      });
                    }
                  : undefined
              }
            />
          );
        })}
      </div>

      {cancelTarget && (
        <CancelShowDialog
          show={cancelTarget}
          open
          onOpenChange={(open) => {
            if (!open) setCancelTarget(null);
          }}
          onConfirm={handleConfirmCancel}
        />
      )}
    </section>
  );
}

type ShowCardProps = {
  index: number;
  showId?: string;
  isCancelled: boolean;
  isLocked: boolean;
  isPast: boolean;
  disabled: boolean;
  ticketCount: number;
  register: ReturnType<typeof useFormContext<EventFormValues>>["register"];
  errors: NonNullable<
    ReturnType<typeof useFormContext<EventFormValues>>["formState"]["errors"]["shows"]
  >[number];
  onRemove: () => void;
  onRequestCancel?: () => void;
};

function ShowCard({
  index,
  showId,
  isCancelled,
  isLocked,
  isPast,
  disabled,
  ticketCount,
  register,
  errors,
  onRemove,
  onRequestCancel,
}: ShowCardProps) {
  return (
    <div
      className={
        isCancelled
          ? "relative rounded-lg border border-state-error/30 bg-state-error-bg p-4"
          : "relative rounded-lg border border-border-default bg-bg-surface p-4"
      }
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          {isCancelled && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-state-error-bg px-2.5 py-1 text-xs font-medium text-state-error">
              <CalendarX className="h-3 w-3" aria-hidden />
              Показ отменён
            </span>
          )}
          {isLocked && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-state-warning-bg px-2.5 py-1 text-xs font-medium text-state-warning">
              <Lock className="h-3 w-3" aria-hidden />
              Продано {ticketCount} {pluralBilet(ticketCount)}
            </span>
          )}
          {isPast && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-bg-muted px-2.5 py-1 text-xs font-medium text-text-secondary">
              <Clock className="h-3 w-3" aria-hidden />
              Прошедший
            </span>
          )}
          {!disabled && (
            <span className="text-sm font-medium text-text-secondary">
              Показ {index + 1}
            </span>
          )}
        </div>

        {isLocked && onRequestCancel && (
          <button
            type="button"
            onClick={onRequestCancel}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-medium text-state-error transition-colors hover:bg-state-error-bg"
          >
            <Ban className="h-3.5 w-3.5" aria-hidden />
            Отменить показ
          </button>
        )}

        {!disabled && (
          <button
            type="button"
            onClick={onRemove}
            aria-label="Удалить показ"
            className="rounded-md p-1 text-text-tertiary transition-colors hover:bg-state-error-bg hover:text-state-error"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>

      {showId && <input type="hidden" {...register(`shows.${index}.id`)} />}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label
            htmlFor={`show-${index}-startsAt`}
            className="text-sm font-medium text-text-primary"
          >
            Дата и время
          </label>
          <input
            id={`show-${index}-startsAt`}
            type="datetime-local"
            disabled={disabled}
            aria-invalid={!!errors?.startsAt}
            {...register(`shows.${index}.startsAt`)}
            className="h-11 rounded-md border border-border-default bg-bg-surface px-3 text-base text-text-primary outline-none focus-visible:border-brand-teal disabled:cursor-not-allowed disabled:bg-bg-elevated disabled:text-text-tertiary aria-invalid:border-state-error"
          />
          {errors?.startsAt && (
            <p className="text-sm text-state-error">{errors.startsAt.message}</p>
          )}
        </div>

        {PRICE_FIELDS.map((pf) => (
          <div key={pf.name} className="flex flex-col gap-1.5">
            <label
              htmlFor={`show-${index}-${pf.name}`}
              className="text-sm font-medium text-text-primary"
            >
              {pf.label}, ₸
            </label>
            <input
              id={`show-${index}-${pf.name}`}
              type="number"
              min={100}
              max={100000}
              step={100}
              disabled={disabled}
              aria-invalid={!!errors?.[pf.name]}
              {...register(`shows.${index}.${pf.name}`, { valueAsNumber: true })}
              className="h-11 rounded-md border border-border-default bg-bg-surface px-3 text-base text-text-primary outline-none focus-visible:border-brand-teal disabled:cursor-not-allowed disabled:bg-bg-elevated disabled:text-text-tertiary aria-invalid:border-state-error"
            />
            {errors?.[pf.name] && (
              <p className="text-sm text-state-error">
                {errors[pf.name]?.message}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function pluralBilet(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "билет";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "билета";
  return "билетов";
}
