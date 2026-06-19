/**
 * Locale-aware formatting helpers for prices, dates, and multi-language event fields.
 * Currency rule (per CLAUDE.md): "4 000 ₸" with non-breaking spaces, never "KZT 4000" or "4000тг".
 */

export type AppLocale = "kz" | "ru" | "ug";

// Mapping from app locale to Intl BCP-47 tag.
// TODO: improve Uyghur date formatting — Cyrillic Uyghur has no standard Intl locale,
// so we fall back to Russian month/weekday names for now.
const INTL_LOCALE: Record<AppLocale, string> = {
  kz: "kk-KZ",
  ru: "ru-RU",
  ug: "ru-RU",
};

const NBSP = " ";

export function formatPrice(amount: number, _locale: string): string {
  // ru-RU groups by thin space (U+202F) or regular space; normalize to NBSP so it never wraps.
  const grouped = new Intl.NumberFormat("ru-RU", { useGrouping: true }).format(amount);
  return grouped.replace(/\s/g, NBSP) + NBSP + "₸";
}

export function formatShowDate(date: Date, locale: AppLocale): string {
  const intlLocale = INTL_LOCALE[locale];
  const datePart = new Intl.DateTimeFormat(intlLocale, {
    day: "numeric",
    month: "long",
  }).format(date);
  const weekdayPart = new Intl.DateTimeFormat(intlLocale, { weekday: "long" }).format(date);
  const timePart = new Intl.DateTimeFormat(intlLocale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
  return `${datePart}, ${weekdayPart}, ${timePart}`;
}

export function formatShowDateShort(date: Date, locale: AppLocale): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    day: "numeric",
    month: "long",
  }).format(date);
}

/** Day number + short uppercased month, for compact date badges (e.g. "21" / "ИЮН"). */
export function formatDateParts(
  date: Date,
  locale: AppLocale,
): { day: string; month: string } {
  const intlLocale = INTL_LOCALE[locale];
  const day = new Intl.DateTimeFormat(intlLocale, { day: "numeric" }).format(date);
  const month = new Intl.DateTimeFormat(intlLocale, { month: "short" })
    .format(date)
    .replace(".", "")
    .toUpperCase();
  return { day, month };
}

/** Long weekday name only, e.g. "пятница". */
export function formatWeekday(date: Date, locale: AppLocale): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], { weekday: "long" }).format(
    date,
  );
}

/** 24-hour time, e.g. "19:00". */
export function formatTime(date: Date, locale: AppLocale): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

/**
 * Stable calendar-day key (YYYY-MM-DD in the server timezone) for grouping
 * shows by date. Uses en-CA for the ISO-like ordering; display strings are
 * formatted separately via the locale-aware helpers above.
 */
export function dateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function formatShowDayTime(date: Date, locale: AppLocale): string {
  const intlLocale = INTL_LOCALE[locale];
  const weekday = new Intl.DateTimeFormat(intlLocale, { weekday: "long" }).format(date);
  const time = new Intl.DateTimeFormat(intlLocale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
  return `${weekday}, ${time}`;
}

/**
 * Compact relative timestamp for admin tables: "5 мин назад", "3 ч назад",
 * "вчера", then an absolute short date ("12 июня" / "12 июня 2025") once it's
 * older than yesterday. Russian-only — used in the RU-only admin panel.
 */
export function formatRelativeDate(date: Date, locale: AppLocale = "ru"): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return "только что";
  if (diffMin < 60) return `${diffMin} мин назад`;

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  if (date >= startOfToday) {
    const diffH = Math.floor(diffMin / 60);
    return `${diffH} ч назад`;
  }
  if (date >= startOfYesterday) return "вчера";

  const withYear = date.getFullYear() !== now.getFullYear();
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    day: "numeric",
    month: "long",
    ...(withYear ? { year: "numeric" } : {}),
  }).format(date);
}

type EventTitles = { titleRu: string; titleKz: string; titleUg: string };

export function getEventTitle<E extends EventTitles>(event: E, locale: AppLocale): string {
  switch (locale) {
    case "kz":
      return event.titleKz;
    case "ug":
      return event.titleUg;
    default:
      return event.titleRu;
  }
}

type EventDescriptions = {
  descriptionRu: string | null;
  descriptionKz: string | null;
  descriptionUg: string | null;
};

export function getEventDescription<E extends EventDescriptions>(
  event: E,
  locale: AppLocale,
): string | null {
  switch (locale) {
    case "kz":
      return event.descriptionKz;
    case "ug":
      return event.descriptionUg;
    default:
      return event.descriptionRu;
  }
}
