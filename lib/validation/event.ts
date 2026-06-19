import { z } from "zod";

/**
 * Shared validation for the admin Event + Shows form.
 *
 * One schema, two trust boundaries: the client form (react-hook-form resolver)
 * AND the server actions both parse with these. The form holds JS-native values
 * (numbers via `valueAsNumber`, "" for empty text, null for cleared optionals),
 * so the schema is written to accept exactly those runtime shapes.
 *
 * Prices are independent (no enforced tier ordering): each 100–100000 ₸.
 */

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const requiredText = (msg: string) => z.string().trim().min(1, msg);

// "" is a valid empty description; the action converts it to null before write.
const optionalText = z.string().trim();

const price = z
  .number({ message: "Введите цену" })
  .int("Целое число")
  .min(100, "Минимум 100 ₸")
  .max(100000, "Максимум 100 000 ₸");

// Empty number input + valueAsNumber yields NaN — normalize that to null.
const nanToNull = (v: unknown) =>
  typeof v === "number" && Number.isNaN(v) ? null : v;

export const showSchema = z.object({
  // Present for existing shows; absent for newly-added rows.
  id: z.string().optional(),
  startsAt: z
    .string()
    .min(1, "Укажите дату и время")
    .refine((v) => !Number.isNaN(new Date(v).getTime()), "Некорректная дата"),
  pricePremium: price,
  priceStandard: price,
  priceEconomy: price,
  priceBalcony: price,
});

const eventFields = {
  slug: z
    .string()
    .trim()
    .min(1, "Укажите slug")
    .regex(SLUG_RE, "Только латиница в нижнем регистре, цифры и дефис"),
  titleRu: requiredText("Введите название (RU)"),
  titleKz: requiredText("Введите название (KZ)"),
  titleUg: requiredText("Введите название (UG)"),
  descriptionRu: optionalText,
  descriptionKz: optionalText,
  descriptionUg: optionalText,
  genre: optionalText,
  cast: z.array(z.string().trim().min(1)).default([]),
  director: z.string().trim().nullish(),
  ageRating: z.preprocess(
    nanToNull,
    z.number().int().min(0, "От 0").max(21, "До 21").nullable(),
  ),
  durationMin: z.preprocess(
    nanToNull,
    z
      .number()
      .int()
      .min(1, "Минимум 1 минута")
      .max(600, "Максимум 600 минут")
      .nullable(),
  ),
  posterUrl: z.preprocess(
    (v) => (v === "" ? null : v),
    z.string().url().nullable(),
  ),
};

export const createEventSchema = z.object({
  ...eventFields,
  shows: z.array(showSchema).min(1, "Добавьте хотя бы один показ"),
});

export const updateEventSchema = z.object({
  ...eventFields,
  // On edit we allow clearing all shows (admin may rebuild from scratch).
  shows: z.array(showSchema),
});

// ── Form-facing types (what react-hook-form holds in state) ──
export type ShowFormValue = {
  id?: string;
  startsAt: string;
  pricePremium: number;
  priceStandard: number;
  priceEconomy: number;
  priceBalcony: number;
};

export type EventFormValues = {
  slug: string;
  titleRu: string;
  titleKz: string;
  titleUg: string;
  descriptionRu: string;
  descriptionKz: string;
  descriptionUg: string;
  genre: string;
  cast: string[];
  director: string;
  ageRating: number | null;
  durationMin: number | null;
  posterUrl: string | null;
  shows: ShowFormValue[];
};

// Action payloads are the same shape; actions re-parse with the schemas above.
export type CreateEventInput = EventFormValues;
export type UpdateEventInput = EventFormValues;

export type CancelSummary = {
  cancelledBookings: number;
  refundedTickets: number;
  refundedAmount: number;
};

export type ActionResult =
  | { ok: true; message?: string; summary?: CancelSummary }
  | { ok: false; error: string };

// ── Default prices for a freshly-added show (matches seed STANDARD_PRICES) ──
export const DEFAULT_SHOW_PRICES = {
  pricePremium: 4000,
  priceStandard: 3500,
  priceEconomy: 3000,
  priceBalcony: 2500,
} as const;

// ── ageRating <-> DB string ("12+") helpers ──
// DB column is String? ("6+", "12+"); the form edits a plain 0–21 number.
export function ageRatingToDb(value: number | null): string | null {
  return value === null ? null : `${value}+`;
}

export function ageRatingFromDb(value: string | null): number | null {
  if (!value) return null;
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? null : n;
}

// ── Slug auto-generation from a Cyrillic title (KZ/RU/UG) ──
const CYRILLIC_MAP: Record<string, string> = {
  а: "a", ә: "a", б: "b", в: "v", г: "g", ғ: "g", д: "d", е: "e", ё: "e",
  ж: "zh", җ: "j", з: "z", и: "i", й: "y", к: "k", қ: "k", л: "l", м: "m",
  н: "n", ң: "n", о: "o", ө: "o", п: "p", р: "r", с: "s", т: "t", у: "u",
  ұ: "u", ү: "u", ф: "f", х: "h", һ: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch",
  ъ: "", ы: "y", і: "i", ь: "", э: "e", ю: "yu", я: "ya",
};

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .split("")
    .map((ch) => (ch in CYRILLIC_MAP ? CYRILLIC_MAP[ch] : ch))
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}
