import { CalendarX } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/layout/Container";
import type { AppLocale } from "@/lib/format";

type ShowCancelledNoticeProps = {
  eventSlug: string;
  locale: AppLocale;
};

/**
 * Public fallback shown wherever a cancelled show would otherwise render a seat
 * map or checkout form (seat page deep-link, in-flight checkout race).
 */
export function ShowCancelledNotice({
  eventSlug,
  locale,
}: ShowCancelledNoticeProps) {
  return (
    <Container className="py-16">
      <div className="mx-auto flex max-w-md flex-col items-center gap-5 rounded-lg border border-border-default bg-bg-surface p-8 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-state-error-bg text-state-error">
          <CalendarX className="h-6 w-6" aria-hidden />
        </span>
        <h1 className="font-display text-3xl font-medium leading-tight text-text-primary md:text-4xl">
          Показ отменён
        </h1>
        <p className="text-text-secondary">
          К сожалению, этот показ был отменён театром. Если у вас был куплен
          билет, средства возвращены на исходный способ оплаты в течение 3–5
          рабочих дней.
        </p>
        <Link
          href={`/events/${eventSlug}`}
          locale={locale}
          className="mt-1 inline-flex h-11 items-center justify-center rounded-md bg-brand-teal px-6 text-sm font-medium text-white transition-colors duration-200 hover:bg-brand-teal-dark"
        >
          Вернуться к событию
        </Link>
      </div>
    </Container>
  );
}
