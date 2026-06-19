import { getTranslations } from "next-intl/server";
import { EventCard, type EventCardData } from "./EventCard";
import { Reveal } from "./Reveal";
import { type AppLocale } from "@/lib/format";

type EventGridProps = {
  events: EventCardData[];
  locale: AppLocale;
};

export async function EventGrid({ events, locale }: EventGridProps) {
  if (events.length === 0) {
    const t = await getTranslations("catalog");
    return (
      <div className="py-24 text-center text-text-secondary">{t("empty")}</div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
      {events.map((event, i) => (
        <Reveal key={event.slug} index={i} className="h-full">
          <EventCard
            event={event}
            locale={locale}
            priority={i < 4}
            index={i + 1}
          />
        </Reveal>
      ))}
    </div>
  );
}
