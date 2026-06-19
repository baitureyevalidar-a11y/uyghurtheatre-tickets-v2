"use client";

import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Loader2 } from "lucide-react";
import { formatPrice, formatShowDate } from "@/lib/format";

type CancelShowDialogProps = {
  show: {
    id: string;
    startsAt: Date;
    ticketsCount: number;
    totalAmount: number;
  };
  onConfirm: () => Promise<void>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CancelShowDialog({
  show,
  onConfirm,
  open,
  onOpenChange,
}: CancelShowDialogProps) {
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setSubmitting(false);
    }
  };

  const hasSales = show.ticketsCount > 0;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/40" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-40 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border-default bg-bg-surface p-6 shadow-lg focus:outline-none">
          <Dialog.Title className="font-display text-2xl font-medium text-text-primary">
            Отменить показ?
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-text-secondary">
            {formatShowDate(show.startsAt, "ru")}
          </Dialog.Description>

          <div className="mt-4 rounded-md bg-bg-elevated p-4">
            {hasSales ? (
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Будет возвращено</span>
                  <span className="font-medium text-text-primary">
                    {show.ticketsCount} билетов
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Сумма возврата</span>
                  <span className="font-medium text-text-primary">
                    {formatPrice(show.totalAmount, "ru")}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-text-primary">
                Показ без проданных билетов — деньги возвращать не нужно.
              </p>
            )}
            <p className="mt-3 text-xs text-text-tertiary">
              Действие необратимо. Деньги вернутся клиентам на исходный способ
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
                  Отменяем…
                </>
              ) : (
                "Подтвердить отмену"
              )}
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
