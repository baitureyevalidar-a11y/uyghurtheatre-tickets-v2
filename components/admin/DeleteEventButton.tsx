"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import type { ActionResult } from "@/lib/validation/event";

type DeleteEventButtonProps = {
  action: () => Promise<ActionResult>;
  disabled: boolean;
};

const DISABLED_TOOLTIP = "Есть проданные билеты, отменяйте показы отдельно";

export function DeleteEventButton({ action, disabled }: DeleteEventButtonProps) {
  const [pending, startTransition] = useTransition();

  if (disabled) {
    return (
      <button
        type="button"
        disabled
        title={DISABLED_TOOLTIP}
        aria-label={DISABLED_TOOLTIP}
        className="inline-flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-md text-text-tertiary opacity-50"
      >
        <Trash2 className="h-4 w-4" aria-hidden />
      </button>
    );
  }

  const handleClick = () => {
    if (!window.confirm("Удалить событие? Действие необратимо.")) return;
    startTransition(async () => {
      const res = await action();
      if (res && !res.ok) window.alert(res.error);
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-label="Удалить событие"
      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-state-error transition-colors hover:bg-state-error-bg disabled:opacity-50"
    >
      <Trash2 className="h-4 w-4" aria-hidden />
    </button>
  );
}
