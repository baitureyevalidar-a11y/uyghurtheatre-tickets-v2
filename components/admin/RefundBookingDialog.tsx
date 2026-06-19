"use client";

import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Loader2 } from "lucide-react";
import { formatPrice, formatShowDate } from "@/lib/format";
import { pluralBilet } from "@/lib/validation/booking";

type RefundBookingDialogProps = {
  booking: {
    id: string;
    customerName: string;
    customerPhone: string;
    ticketsCount: number;
    totalAmount: number;
    showTitle: string;
    showStartsAt: Date;
  };
  onConfirm: () => Promise<void>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function RefundBookingDialog({
  booking,
  onConfirm,
  open,
  onOpenChange,
}: RefundBookingDialogProps) {
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/40" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-40 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border-default bg-bg-surface p-6 shadow-lg focus:outline-none">
          <Dialog.Title className="font-display text-2xl font-medium text-text-primary">
            Вернуть деньги по брони?
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-text-secondary">
            <span className="font-mono">{booking.id.slice(0, 8)}</span> ·{" "}
            {booking.customerPhone}
          </Dialog.Description>

          <div className="mt-4 space-y-1.5 rounded-md bg-bg-elevated p-4 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-text-secondary">Клиент</span>
              <span className="text-right font-medium text-text-primary">
                {booking.customerName || "без имени"}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-text-secondary">Показ</span>
              <span className="text-right font-medium text-text-primary">
                {booking.showTitle}
                <span className="block text-xs font-normal text-text-tertiary">
                  {formatShowDate(booking.showStartsAt, "ru")}
                </span>
              </span>
            </div>
            <div className="flex justify-between gap-4 border-t border-border-subtle pt-1.5">
              <span className="text-text-secondary">
                {booking.ticketsCount} {pluralBilet(booking.ticketsCount)}
              </span>
              <span className="font-medium text-text-primary">
                {formatPrice(booking.totalAmount, "ru")}
              </span>
            </div>
            <p className="pt-2 text-xs text-text-tertiary">
              Действие необратимо. Деньги вернутся клиенту на исходный способ
              оплаты в течение 3–5 рабочих дней.
            </p>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              disabled={submitting}
              onClick={() => onOpenChange(false)}
              className="h-10 rounded-md px-4 text-sm font-medium text-text-primary transition-colors hover:bg-bg-elevated disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleConfirm}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-state-error px-4 text-sm font-medium text-white transition-colors hover:bg-state-error/90 disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Оформляем…
                </>
              ) : (
                "Подтвердить возврат"
              )}
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
