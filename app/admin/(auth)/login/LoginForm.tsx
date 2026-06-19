"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction } from "./actions";

const Schema = z.object({
  phone: z.string().regex(/^\+?7\d{10}$/, "Формат: +77001234567"),
  password: z.string().min(1, "Введите пароль"),
});

type FormValues = z.infer<typeof Schema>;

export function LoginForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: { phone: "", password: "" },
  });

  const onSubmit = handleSubmit((values) => {
    setServerError(null);
    startTransition(async () => {
      const result = await loginAction(values);
      if (result && "error" in result) {
        setServerError(result.error);
      }
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phone">Телефон</Label>
        <Input
          id="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+77001234567"
          aria-invalid={!!errors.phone}
          {...register("phone")}
        />
        {errors.phone && (
          <p className="text-sm text-state-error">{errors.phone.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Пароль</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={!!errors.password}
          {...register("password")}
        />
        {errors.password && (
          <p className="text-sm text-state-error">{errors.password.message}</p>
        )}
      </div>

      {serverError && (
        <div className="rounded-md bg-state-error-bg p-3 text-sm text-state-error">
          {serverError}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="block h-12 w-full rounded-md bg-brand-teal text-sm font-medium text-white transition-colors duration-200 hover:bg-brand-teal-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Входим..." : "Войти"}
      </button>
    </form>
  );
}
