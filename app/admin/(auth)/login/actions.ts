"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { z } from "zod";
import { signIn } from "@/lib/auth";

const Schema = z.object({
  phone: z.string().regex(/^\+?7\d{10}$/),
  password: z.string().min(1),
});

export type LoginResult = { error: string };

export async function loginAction(raw: unknown): Promise<LoginResult | void> {
  const parsed = Schema.safeParse(raw);
  if (!parsed.success) return { error: "Неверные данные" };

  try {
    await signIn("credentials", {
      phone: parsed.data.phone,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return { error: "Неверный телефон или пароль" };
    }
    throw e;
  }

  // signIn with redirect:false returns silently on success — bounce to dashboard.
  redirect("/admin");
}
