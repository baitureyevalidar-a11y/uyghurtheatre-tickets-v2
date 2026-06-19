import { getTranslations } from "next-intl/server";
import {
  formatPrice,
  formatShowDate,
  getEventTitle,
  type AppLocale,
} from "@/lib/format";
import { HoldTimer } from "./HoldTimer";

type OrderSummaryProps = {
  event: { titleRu: string; titleKz: string; titleUg: string };
  startsAt: Date;
  seats: Array<{
    zoneName: string;
    row: number;
    seat: number;
    price: number;
  }>;
  total: number;
  locale: AppLocale;
  expiresAt: Date | null;
};

export async function OrderSummary({
  event,
  startsAt,
  seats,
  total,
  locale,
  expiresAt,
}: OrderSummaryProps) {
  const t = await getTranslations("checkout");
  const eventTitle = getEventTitle(event, locale);

  return (
    <aside className="rounded-lg bg-bg-muted p-6">
      <h3 className="text-base font-semibold text-text-primary">
        {t("yourOrder")}
      </h3>
      <div className="mt-2 text-sm text-text-secondary">
        <div className="font-medium text-text-primary">{eventTitle}</div>
        <div>{formatShowDate(startsAt, locale)}</div>
      </div>

      <ul className="mt-5 divide-y divide-border-default">
        {seats.map((s, i) => (
          <li
            key={`${s.zoneName}-${s.row}-${s.seat}-${i}`}
            className="flex items-center justify-between gap-3 py-2 text-sm"
          >
            <span className="text-text-primary">
              {s.zoneName}, ряд {s.row}, место {s.seat}
            </span>
            <span className="shrink-0 font-medium text-text-primary">
              {formatPrice(s.price, locale)}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-baseline justify-between border-t border-border-default pt-4">
        <span className="text-sm font-semibold text-text-primary">
          {t("total")}
        </span>
        <span className="font-display text-xl font-medium text-text-primary">
          {formatPrice(total, locale)}
        </span>
      </div>

      {expiresAt && (
        <div className="mt-4">
          <HoldTimer expiresAt={expiresAt.toISOString()} />
        </div>
      )}
    </aside>
  );
}
