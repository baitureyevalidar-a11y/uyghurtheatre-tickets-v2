"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type HoldTimerProps = {
  /** ISO string so the prop is serializable across the client boundary. */
  expiresAt: string;
};

function format(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function HoldTimer({ expiresAt }: HoldTimerProps) {
  const t = useTranslations("checkout");
  const router = useRouter();
  const expiryMs = new Date(expiresAt).getTime();
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, Math.floor((expiryMs - Date.now()) / 1000)),
  );

  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => {
      const next = Math.max(0, Math.floor((expiryMs - Date.now()) / 1000));
      setRemaining(next);
      if (next === 0) {
        clearInterval(id);
        // Re-trigger server validation — page.tsx will show the expired banner.
        router.refresh();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [expiryMs, remaining, router]);

  if (remaining === 0) {
    return (
      <div className="text-sm font-medium text-state-error">
        {t("holdExpired")}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "text-sm",
        remaining < 60 ? "font-medium text-state-warning" : "text-text-secondary",
      )}
    >
      {t("holdTimer", { time: format(remaining) })}
    </div>
  );
}
