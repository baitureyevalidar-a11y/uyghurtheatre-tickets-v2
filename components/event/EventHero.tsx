import Image from "next/image";
import { getEventTitle, type AppLocale } from "@/lib/format";

export type EventHeroData = {
  titleRu: string;
  titleKz: string;
  titleUg: string;
  coverUrl: string | null;
  genre: string | null;
  ageRating: string | null;
  durationMin: number | null;
};

type EventHeroProps = {
  event: EventHeroData;
  locale: AppLocale;
};

/**
 * The big poster banner at the top of the event detail page.
 * Title + metadata moved below the poster (see the event detail page) — this
 * component renders only the preserved poster section.
 */
export function EventHero({ event, locale }: EventHeroProps) {
  const title = getEventTitle(event, locale);

  return (
    <section>
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-brand-beige md:aspect-[21/9]">
        {event.coverUrl && (
          <Image
            src={event.coverUrl}
            alt={title}
            fill
            sizes="100vw"
            priority
            className="object-cover"
          />
        )}
      </div>
    </section>
  );
}
