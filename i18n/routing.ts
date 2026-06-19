import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["kz", "ru", "ug"],
  defaultLocale: "ru",
  localePrefix: "always",
});

export type AppLocale = (typeof routing.locales)[number];
