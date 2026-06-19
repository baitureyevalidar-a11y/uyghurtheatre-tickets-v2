"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { completeBookingAction } from "@/app/[locale]/checkout/[bookingId]/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPrice, type AppLocale } from "@/lib/format";
import { cn } from "@/lib/utils";

const PAYMENT_METHODS = ["KASPI_PAY", "EPAY_KZ"] as const;

type CheckoutFormProps = {
  bookingId: string;
  total: number;
  locale: AppLocale;
};

export function CheckoutForm({ bookingId, total, locale }: CheckoutFormProps) {
  const t = useTranslations("checkout");
  const tValidation = useTranslations("checkout.validation");
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const schema = z.object({
    customerName: z.string().min(2, tValidation("nameRequired")),
    customerPhone: z.string().regex(/^\+?7\d{10}$/, tValidation("phoneFormat")),
    customerEmail: z.union([z.literal(""), z.string().email(tValidation("emailInvalid"))]),
    paymentMethod: z.enum(PAYMENT_METHODS),
  });

  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      paymentMethod: "KASPI_PAY",
    },
  });

  const selectedPayment = watch("paymentMethod");

  const onSubmit = handleSubmit((values) => {
    setServerError(null);
    startTransition(async () => {
      const result = await completeBookingAction({
        bookingId,
        locale,
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        customerEmail: values.customerEmail,
        paymentMethod: values.paymentMethod,
      });
      // On success the action redirects; if it returned, it's an error.
      if (result && "error" in result) {
        setServerError(result.error);
      }
    });
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="customerName">{t("name")}</Label>
        <Input
          id="customerName"
          type="text"
          autoComplete="name"
          placeholder={t("namePlaceholder")}
          aria-invalid={!!errors.customerName}
          {...register("customerName")}
        />
        {errors.customerName && (
          <p className="text-sm text-state-error">{errors.customerName.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="customerPhone">{t("phone")}</Label>
        <Input
          id="customerPhone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+77001234567"
          aria-invalid={!!errors.customerPhone}
          {...register("customerPhone")}
        />
        {errors.customerPhone ? (
          <p className="text-sm text-state-error">{errors.customerPhone.message}</p>
        ) : (
          <p className="text-sm text-text-tertiary">{t("phoneHelper")}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="customerEmail">{t("email")}</Label>
        <Input
          id="customerEmail"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          aria-invalid={!!errors.customerEmail}
          {...register("customerEmail")}
        />
        {errors.customerEmail ? (
          <p className="text-sm text-state-error">{errors.customerEmail.message}</p>
        ) : (
          <p className="text-sm text-text-tertiary">{t("emailHelper")}</p>
        )}
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-sm font-medium text-text-primary">
          {t("paymentMethod")}
        </legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {PAYMENT_METHODS.map((method) => {
            const isActive = selectedPayment === method;
            const label = method === "KASPI_PAY" ? t("kaspi") : t("epay");
            return (
              <label
                key={method}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-md border p-4 text-sm transition-colors",
                  isActive
                    ? "border-brand-teal bg-bg-muted"
                    : "border-border-default hover:border-border-strong",
                )}
              >
                <input
                  type="radio"
                  value={method}
                  className="accent-brand-teal"
                  {...register("paymentMethod")}
                />
                <span className="font-medium text-text-primary">{label}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {serverError && (
        <div className="rounded-md bg-state-error-bg p-3 text-sm text-state-error">
          {serverError}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="block h-14 w-full rounded-md bg-brand-gold text-base font-semibold text-brand-teal-dark transition-colors duration-200 hover:bg-brand-gold-dark disabled:cursor-not-allowed disabled:bg-text-tertiary disabled:text-white"
      >
        {isPending
          ? t("processing")
          : t("payButton", { total: formatPrice(total, locale) })}
      </button>
    </form>
  );
}
