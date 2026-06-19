"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  useForm,
  FormProvider,
  type FieldErrors,
  type Resolver,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShowStatus } from "@prisma/client";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ageRatingFromDb,
  createEventSchema,
  updateEventSchema,
  slugify,
  type ActionResult,
  type EventFormValues,
} from "@/lib/validation/event";
import { ShowsFieldArray, type ShowMeta } from "./ShowsFieldArray";
import { PosterUpload } from "./PosterUpload";

export type EventWithShows = {
  id: string;
  slug: string;
  titleRu: string;
  titleKz: string;
  titleUg: string;
  descriptionRu: string | null;
  descriptionKz: string | null;
  descriptionUg: string | null;
  genre: string | null;
  cast: string[];
  director: string | null;
  ageRating: string | null;
  durationMin: number | null;
  posterUrl: string | null;
  shows: Array<{
    id: string;
    status: ShowStatus;
    startsAt: Date;
    pricePremium: number;
    priceStandard: number;
    priceEconomy: number;
    priceBalcony: number;
    ticketCount: number;
    totalAmount: number;
  }>;
};

type EventFormProps =
  | {
      mode: "create";
      event?: undefined;
      onSubmitAction: (values: EventFormValues) => Promise<ActionResult>;
    }
  | {
      mode: "edit";
      event: EventWithShows;
      onSubmitAction: (values: EventFormValues) => Promise<ActionResult>;
      onDeleteAction: () => Promise<ActionResult>;
      onCancelShowAction: (showId: string) => Promise<ActionResult>;
    };

type AppLocale = "ru" | "kz" | "ug";
const LOCALE_TABS: { id: AppLocale; label: string }[] = [
  { id: "kz", label: "KZ" },
  { id: "ru", label: "RU" },
  { id: "ug", label: "UG" },
];
const LOCALE_FIELDS: Record<AppLocale, (keyof EventFormValues)[]> = {
  ru: ["titleRu", "descriptionRu"],
  kz: ["titleKz", "descriptionKz"],
  ug: ["titleUg", "descriptionUg"],
};

const fieldClass =
  "h-11 w-full rounded-md border border-border-default bg-bg-surface px-3 text-base text-text-primary outline-none focus-visible:border-brand-teal aria-invalid:border-state-error";

function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export function EventForm(props: EventFormProps) {
  const { mode } = props;
  const event = mode === "edit" ? props.event : undefined;

  const [activeLocale, setActiveLocale] = useState<AppLocale>("ru");
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();
  const [deleting, startDeleteTransition] = useTransition();

  const showMeta = useMemo<Map<string, ShowMeta>>(
    () =>
      new Map(
        (event?.shows ?? []).map((s) => [
          s.id,
          {
            ticketCount: s.ticketCount,
            startsAt: s.startsAt,
            status: s.status,
            totalAmount: s.totalAmount,
          },
        ]),
      ),
    [event],
  );

  const defaultValues = useMemo<EventFormValues>(() => {
    if (event) {
      return {
        slug: event.slug,
        titleRu: event.titleRu,
        titleKz: event.titleKz,
        titleUg: event.titleUg,
        descriptionRu: event.descriptionRu ?? "",
        descriptionKz: event.descriptionKz ?? "",
        descriptionUg: event.descriptionUg ?? "",
        genre: event.genre ?? "",
        cast: event.cast,
        director: event.director ?? "",
        ageRating: ageRatingFromDb(event.ageRating),
        durationMin: event.durationMin,
        posterUrl: event.posterUrl,
        shows: event.shows.map((s) => ({
          id: s.id,
          startsAt: toLocalInput(s.startsAt),
          pricePremium: s.pricePremium,
          priceStandard: s.priceStandard,
          priceEconomy: s.priceEconomy,
          priceBalcony: s.priceBalcony,
        })),
      };
    }
    return {
      slug: "",
      titleRu: "",
      titleKz: "",
      titleUg: "",
      descriptionRu: "",
      descriptionKz: "",
      descriptionUg: "",
      genre: "",
      cast: [],
      director: "",
      ageRating: null,
      durationMin: null,
      posterUrl: null,
      shows: [
        {
          id: undefined,
          startsAt: "",
          pricePremium: 4000,
          priceStandard: 3500,
          priceEconomy: 3000,
          priceBalcony: 2500,
        },
      ],
    };
  }, [event]);

  const methods = useForm<EventFormValues>({
    // Runtime shapes match EventFormValues; the schema's coercion/preprocess
    // makes its inferred input type wider, so we narrow the resolver here.
    resolver: zodResolver(
      mode === "create" ? createEventSchema : updateEventSchema,
    ) as unknown as Resolver<EventFormValues>,
    defaultValues,
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = methods;

  // Auto-generate slug from RU title in create mode, until the user edits slug.
  const [slugTouched, setSlugTouched] = useState(false);
  const titleRu = watch("titleRu");
  useEffect(() => {
    if (mode === "create" && !slugTouched) {
      setValue("slug", slugify(titleRu));
    }
  }, [titleRu, slugTouched, mode, setValue]);

  const posterUrl = watch("posterUrl");

  const onValid = (values: EventFormValues) => {
    setServerError(null);
    startTransition(async () => {
      const res = await props.onSubmitAction(values);
      // On success the action redirects (the promise resolves to no payload).
      if (res && !res.ok) setServerError(res.error);
    });
  };

  const onInvalid = (submitErrors: FieldErrors<EventFormValues>) => {
    // Surface a hidden-tab error by switching to the first locale that has one.
    // Use the errors RHF hands us — `formState.errors` is stale this tick.
    for (const loc of ["ru", "kz", "ug"] as const) {
      if (LOCALE_FIELDS[loc].some((f) => submitErrors[f])) {
        setActiveLocale(loc);
        break;
      }
    }
  };

  const handleDelete = () => {
    if (mode !== "edit") return;
    setServerError(null);
    startDeleteTransition(async () => {
      const res = await props.onDeleteAction();
      if (res && !res.ok) {
        setServerError(res.error);
        setConfirmDelete(false);
      }
    });
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit(onValid, onInvalid)}
        className="max-w-3xl space-y-8"
        noValidate
      >
        {serverError && (
          <div className="flex items-start gap-2 rounded-md bg-state-error-bg p-3 text-sm text-state-error">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>{serverError}</span>
          </div>
        )}

        {/* ── Localized fields with locale tabs ── */}
        <section className="space-y-4">
          <div className="flex gap-1 border-b border-border-default">
            {LOCALE_TABS.map((tab) => {
              const hasError = LOCALE_FIELDS[tab.id].some((f) => errors[f]);
              const active = activeLocale === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveLocale(tab.id)}
                  className={cn(
                    "-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors",
                    active
                      ? "border-brand-teal text-brand-teal"
                      : "border-transparent text-text-secondary hover:text-text-primary",
                    hasError && !active && "text-state-error",
                  )}
                >
                  {tab.label}
                  {hasError && <span className="ml-1 text-state-error">•</span>}
                </button>
              );
            })}
          </div>

          {LOCALE_TABS.map((tab) => (
            <div
              key={tab.id}
              className={cn("space-y-4", activeLocale !== tab.id && "hidden")}
            >
              <Field
                label={`Название (${tab.label})`}
                error={errors[`title${capitalize(tab.id)}` as keyof EventFormValues]?.message as string | undefined}
              >
                <input
                  className={fieldClass}
                  aria-invalid={
                    !!errors[`title${capitalize(tab.id)}` as keyof EventFormValues]
                  }
                  {...register(
                    `title${capitalize(tab.id)}` as
                      | "titleRu"
                      | "titleKz"
                      | "titleUg",
                  )}
                />
              </Field>
              <Field label={`Описание (${tab.label})`}>
                <textarea
                  rows={4}
                  className="w-full rounded-md border border-border-default bg-bg-surface px-3 py-2 text-base text-text-primary outline-none focus-visible:border-brand-teal"
                  {...register(
                    `description${capitalize(tab.id)}` as
                      | "descriptionRu"
                      | "descriptionKz"
                      | "descriptionUg",
                  )}
                />
              </Field>
            </div>
          ))}
        </section>

        {/* ── Always-visible metadata ── */}
        <section className="space-y-4">
          <Field label="Slug (URL)" error={errors.slug?.message}>
            <input
              className={cn(fieldClass, "font-mono")}
              aria-invalid={!!errors.slug}
              {...register("slug", {
                onChange: () => setSlugTouched(true),
              })}
            />
          </Field>

          <Field label="Жанр" error={errors.genre?.message}>
            <input
              className={fieldClass}
              placeholder="Музыкальная комедия"
              {...register("genre")}
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Возрастной рейтинг (0–21)" error={errors.ageRating?.message}>
              <input
                type="number"
                min={0}
                max={21}
                className={fieldClass}
                aria-invalid={!!errors.ageRating}
                {...register("ageRating", { valueAsNumber: true })}
              />
            </Field>
            <Field label="Длительность, мин" error={errors.durationMin?.message}>
              <input
                type="number"
                min={1}
                max={600}
                className={fieldClass}
                aria-invalid={!!errors.durationMin}
                {...register("durationMin", { valueAsNumber: true })}
              />
            </Field>
          </div>

          <Field label="Режиссёр" error={errors.director?.message}>
            <input
              className={fieldClass}
              placeholder="Имя режиссёра"
              {...register("director")}
            />
          </Field>

          <Field
            label="В ролях"
            error={
              Array.isArray(errors.cast)
                ? undefined
                : (errors.cast?.message as string | undefined)
            }
          >
            <CastField
              value={watch("cast")}
              onChange={(next) =>
                setValue("cast", next, { shouldDirty: true })
              }
            />
            <p className="text-sm text-text-secondary">
              Введите имя и Enter (или запятую)
            </p>
          </Field>

          <Field label="Постер" error={errors.posterUrl?.message}>
            <PosterUpload
              value={posterUrl}
              onChange={(url) =>
                setValue("posterUrl", url, { shouldDirty: true })
              }
            />
          </Field>
        </section>

        {/* ── Shows ── */}
        <ShowsFieldArray
          showMeta={showMeta}
          onCancelShow={
            mode === "edit" ? props.onCancelShowAction : undefined
          }
        />

        {/* ── Footer ── */}
        <div className="flex items-center justify-between gap-3 border-t border-border-default pt-6">
          {mode === "edit" ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="inline-flex h-11 items-center gap-2 rounded-md px-4 text-sm font-medium text-state-error transition-colors hover:bg-state-error-bg"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              Удалить событие
            </button>
          ) : (
            <span />
          )}

          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-11 items-center rounded-md bg-brand-teal px-6 text-sm font-medium text-white transition-colors hover:bg-brand-teal-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      </form>

      {confirmDelete && mode === "edit" && (
        <ConfirmDialog
          deleting={deleting}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={handleDelete}
        />
      )}
    </FormProvider>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-text-primary">{label}</span>
      {children}
      {error && <p className="text-sm text-state-error">{error}</p>}
    </div>
  );
}

function ConfirmDialog({
  deleting,
  onCancel,
  onConfirm,
}: {
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-lg border border-border-default bg-bg-surface p-6 shadow-lg">
        <h3 className="font-display text-xl font-medium text-text-primary">
          Удалить событие?
        </h3>
        <p className="mt-2 text-sm text-text-secondary">
          Действие необратимо. Все показы без проданных билетов будут удалены.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="h-10 rounded-md border border-border-default px-4 text-sm font-medium text-text-primary transition-colors hover:bg-bg-elevated disabled:opacity-50"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="h-10 rounded-md bg-state-error px-4 text-sm font-medium text-white transition-colors hover:bg-state-error/90 disabled:opacity-50"
          >
            {deleting ? "Удаление..." : "Удалить"}
          </button>
        </div>
      </div>
    </div>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Chip/tag input for the cast list. Enter or comma adds a name; ✕ removes one. */
function CastField({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  const addNames = (raw: string) => {
    const names = raw
      .split(",")
      .map((n) => n.trim())
      .filter((n) => n.length > 0);
    if (names.length === 0) return;
    const merged = [...value];
    for (const n of names) {
      if (!merged.includes(n)) merged.push(n);
    }
    onChange(merged);
    setDraft("");
  };

  const removeAt = (i: number) => onChange(value.filter((_, idx) => idx !== i));

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addNames(draft);
    } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
      removeAt(value.length - 1);
    }
  };

  return (
    <div className="flex min-h-11 flex-wrap items-center gap-2 rounded-md border border-border-default bg-bg-surface px-2 py-1.5 focus-within:border-brand-teal">
      {value.map((name, i) => (
        <span
          key={`${name}-${i}`}
          className="inline-flex items-center gap-1 rounded-full bg-bg-muted px-2.5 py-1 text-sm text-text-primary"
        >
          {name}
          <button
            type="button"
            onClick={() => removeAt(i)}
            className="text-text-tertiary transition-colors hover:text-state-error"
            aria-label={`Удалить ${name}`}
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => addNames(draft)}
        className="min-w-[8ch] flex-1 bg-transparent px-1 py-1 text-base text-text-primary outline-none"
        placeholder={value.length === 0 ? "Имя актёра" : ""}
      />
    </div>
  );
}
