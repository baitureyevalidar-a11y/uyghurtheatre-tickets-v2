"use client";

import { useLocale } from "next-intl";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const LABELS: Record<AppLocale, string> = {
  kz: "ҚАЗ",
  ru: "РУС",
  ug: "ҰЙҒ",
};

export function LocaleSwitcher() {
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const switchTo = (next: AppLocale) => {
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  };

  return (
    <div className="flex items-center gap-0.5 rounded-[9px] border border-line bg-white p-0.5">
      {routing.locales.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => switchTo(l)}
          disabled={isPending || l === locale}
          aria-current={l === locale ? "true" : undefined}
          className={cn(
            "rounded-[7px] px-2.5 py-1 text-xs font-semibold transition-colors",
            l === locale
              ? "bg-garnet text-paper"
              : "text-ink-soft hover:text-garnet",
          )}
        >
          {LABELS[l]}
        </button>
      ))}
    </div>
  );
}
