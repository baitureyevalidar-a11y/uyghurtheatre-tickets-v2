import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Skip i18n routing for: api, _next/_vercel internals, static files,
  // and the Russian-only staff panels (/admin and /kassa) — see CLAUDE.md §6.
  matcher: ["/((?!api|_next|_vercel|admin|kassa|.*\\..*).*)"],
};
