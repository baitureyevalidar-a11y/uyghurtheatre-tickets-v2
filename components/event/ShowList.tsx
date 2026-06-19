import { getTranslations } from "next-intl/server";
import { ShowCard, type ShowCardData } from "./ShowCard";
import { type AppLocale } from "@/lib/format";

type ShowListProps = {
  shows: ShowCardData[];
  locale: AppLocale;
};

export async function ShowList({ shows, locale }: ShowListProps) {
  const t = await getTranslations("event");

  return (
    <section className="py-8">
      <h2 className="font-display text-2xl font-medium text-text-primary">
        {t("upcomingShows")}
      </h2>
      {shows.length === 0 ? (
        <p className="mt-4 italic text-text-secondary">{t("noUpcomingShows")}</p>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {shows.map((show) => (
            <ShowCard key={show.id} show={show} locale={locale} />
          ))}
        </div>
      )}
    </section>
  );
}
