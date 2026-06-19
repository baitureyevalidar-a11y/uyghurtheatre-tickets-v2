"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationProps = {
  current: number;
  totalPages: number;
};

/** Prev/next pager that preserves all other search params in the URL. */
export function Pagination({ current, totalPages }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const goTo = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) params.delete("page");
    else params.set("page", String(page));
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const btnClass =
    "inline-flex h-9 items-center gap-1 rounded-md border border-border-default bg-bg-surface px-3 text-sm font-medium text-text-primary transition-colors hover:bg-bg-elevated disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="flex items-center justify-between">
      <button
        type="button"
        onClick={() => goTo(current - 1)}
        disabled={current <= 1}
        className={btnClass}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        Назад
      </button>
      <span className="text-sm text-text-secondary tabular-nums">
        Страница {current} из {totalPages}
      </span>
      <button
        type="button"
        onClick={() => goTo(current + 1)}
        disabled={current >= totalPages}
        className={btnClass}
      >
        Вперёд
        <ChevronRight className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
