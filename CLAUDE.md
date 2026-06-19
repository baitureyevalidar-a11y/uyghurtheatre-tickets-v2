# CLAUDE.md — Uyghur Theater Ticketing Project Rules

> **Read this file FIRST in every Claude Code session, before writing any code.**
> This is the source of truth for HOW this project is built.
> If a rule here conflicts with a user prompt, follow this file and surface the conflict.

---

## 0. Mission

A custom ticket-purchasing platform for the **State Republican Uyghur Musical Comedy Theater** (Almaty, Kazakhstan). Users arrive from `uyghurtheatre.kz`, buy tickets, get a QR-coded e-ticket by email/SMS.

This is **NOT** a theater brand site. It is a **transactional ticket flow**.

**UX reference:** Ticketon.kz (flow and page structure).
**Visual reference:** Yandex.Afisha (typography, density, polish).
**Bad reference:** generic AI-generated SaaS sites. Do not follow these even partially.

---

## 1. Tech Stack — LOCKED

Do not propose alternatives. Do not add packages outside this list without asking.

- **Framework:** Next.js 16 (App Router, Server Components by default; locale routing via `proxy.ts`)
- **Language:** TypeScript (strict mode)
- **UI:** React 19 + Tailwind CSS v4 + shadcn/ui (Radix primitives)
- **Icons:** Lucide React — **the only icon library**. No emoji as UI.
- **Database:** PostgreSQL on Neon
- **ORM:** Prisma
- **Auth:** NextAuth.js v5 (admin + cashier only — no customer registration)
- **i18n:** next-intl (locales: `kz`, `ru`, `ug`)
- **Validation:** Zod (always pair forms with Zod schemas)
- **Payments:** Kaspi Pay (primary), Epay.kz (fallback)
- **Email:** Resend
- **SMS:** Mobizon.kz
- **QR:** `qrcode` npm package + signed JWT payload
- **PDF:** `@react-pdf/renderer`
- **Forms:** react-hook-form + zodResolver
- **State:** React Server Components + URL state + minimal client state. **No Redux. No Zustand unless explicitly needed for the cart.**

---

## 2. Project Structure

```
/app
  /[locale]                    # public site (KZ/RU/UG)
    layout.tsx
    page.tsx                   # homepage = afisha
    /events/[slug]/page.tsx    # event detail
    /shows/[id]/seats/page.tsx # seat selection
    /checkout/[id]/page.tsx    # checkout form + payment redirect
    /checkout/[id]/success/page.tsx
  /admin
    /(auth)/login/page.tsx
    /(app)
      layout.tsx               # sidebar nav
      page.tsx                 # dashboard
      /events/...
      /shows/...
      /bookings/...
      /users/...
      /settings/page.tsx
  /kassa
    /(auth)/login/page.tsx
    /(app)
      layout.tsx               # touch-friendly layout
      page.tsx                 # today's shows
      /scan/page.tsx           # QR scanner
      /sell/[showId]/page.tsx
      /orders/page.tsx
  /api
    /webhooks/kaspi/route.ts
    /webhooks/epay/route.ts
    /cron/release-expired-holds/route.ts

/components
  /ui/                         # shadcn primitives — DO NOT EDIT
  /hall/                       # HallMap, Seat, ZoneOverview
  /event/                      # EventCard, EventDetail, ShowPicker
  /checkout/                   # CheckoutForm, OrderSummary, HoldTimer
  /admin/                      # admin-specific
  /kassa/                      # cashier-specific
  /layout/                     # Header, Footer, Container

/lib
  /db.ts                       # Prisma client singleton
  /auth.ts                     # NextAuth config
  /i18n.ts                     # next-intl config
  /hall-config.ts              # ⭐ SOURCE OF TRUTH — hall structure
  /design-tokens.ts            # ⭐ SOURCE OF TRUTH — visual decisions
  /payments/kaspi.ts
  /payments/epay.ts
  /tickets/qr.ts
  /tickets/pdf.tsx
  /utils.ts                    # cn() and other helpers

/prisma
  /schema.prisma               # ⭐ SOURCE OF TRUTH — database
  /seed.ts                     # creates test admin + events + shows

/messages
  /kz.json
  /ru.json
  /ug.json
```

---

## 3. Source-of-Truth Files

Before generating ANY code that touches these domains, open and read the corresponding file:

| Domain | File | When to read |
|---|---|---|
| Hall structure (zones, rows, seats, tiers) | `lib/hall-config.ts` | Anything seat-map or seat-related |
| Visual decisions (colors, fonts, spacing) | `lib/design-tokens.ts` | Any UI component |
| Database models | `prisma/schema.prisma` | Any DB query, any new feature |
| User-facing copy | `messages/{kz,ru,ug}.json` | Any text shown to a user |

If a field, value, or string is not in these files — **add it there first**, then reference it. Never hardcode.

---

## 4. Brand & Visual Rules

> **Public side** follows the "Imagine" pomegranate/garnet system (Session D2,
> ported from `design-source/files/`). **Admin** (`app/admin/**`) is a separate,
> simpler system and is NOT governed by these visual rules.

### Colors

Garnet/pomegranate palette. Values live in `lib/design-tokens.ts` (`palette`) and
are mapped to Tailwind v4 tokens in the `@theme` block of `app/globals.css`
(NOT `tailwind.config.ts` — project is on Tailwind v4):

- `#9c2f2a` garnet — primary CTA, links, active states (token `garnet`)
- `#7d2630` garnet-dark — CTA hover, deep accents (`garnet-dark`)
- `#bf8f3f` gold + `#d8b878` gold-soft — accents, eyebrows, numerals on dark
- `#c1572f` ember — scarcity gradient stop
- `#faf6f0` paper / `#f3ebdf` paper-2 — page + soft section surfaces
- `#241f1c` ink / `#5c534c` ink-soft — primary + secondary text on light
- `#1a1410` night / `#241c16` night-2 — dark sections (hero overlay, footer)

```tsx
// CORRECT — semantic Tailwind tokens or the ported utility classes
<button className="cta px-5 py-3">…</button>
<h1 className="font-serif text-ink">…</h1>

// WRONG — never hardcode hex
<button className="bg-[#9c2f2a] text-white">
```

### Typography

- **PT Serif** (`font-serif`) — headings, hero, editorial numerals. Italic
  (`.em`) is the editorial accent. Never for body/UI/buttons.
- **Inter** (`font-sans`) — body, UI, buttons, everything else.
- **Noto Naskh Arabic** (`font-arabic`) — Uyghur RTL. Arabic script does not
  italicize: under `[dir="rtl"]`, `.em` switches to a gold colour treatment, not italics.
- Maximum two type families visible per screen.

### Ported utility classes (in `app/globals.css`)

Public components use these (the `.ut-` prefix from the bundle is dropped):
`.cta` / `.cta-ghost` (garnet button + ghost), `.card` / `.card-int` (lift on
hover), `.em` (editorial italic), `.eyebrow`, `.rule` (garnet→gold motif line),
`.dot` (pulsing urgency dot), `.bignum` / `.cardnum` / `.faqnum` (serif numerals),
`.ph` / `.ph-label` (placeholder media), `.video` / `.video-label`, `.scroll`,
`.fade-in`. The `Pomegranate` brand mark is `components/layout/Pomegranate.tsx`.

### Forbidden Visual Patterns

1. **Gradients only where the design system defines them** — the garnet→gold
   `.rule`, the ember→garnet scarcity meter, `.ph`/`.video` placeholder washes,
   and the dark hero legibility overlay. No arbitrary new gradients on buttons,
   text, or card backgrounds.
2. **No purple, no indigo, no SaaS-pastel palettes.** Garnet palette only.
3. **No glass morphism on cards.** (The sticky header/CTA bar use a deliberate
   `backdrop-blur` over translucent paper — that's the one allowed use.)
4. **No "hero with two CTAs" landing pattern.** This is a ticket store.
5. **No emoji as UI.** Lucide icons + the ported inline SVGs.
6. **Rounding:** buttons/CTAs `12px`, cards `18px` (`.card`). `rounded-full` only
   for dots, avatars, and tag/badge pills.
7. **Shadows come from the named tokens** (`shadow-cta`, `shadow-card`,
   `shadow-card-hover`). No `shadow-2xl` or heavier.
8. **No "Trusted by" sections, testimonial walls, or feature-grid-with-icons.**
9. **No animated gradient borders / CSS sparkle effects.**
10. **No generic loading spinners.** Skeleton screens.
11. **No "Made with ❤️ by" footers.** Footer = theater contact + legal + language switcher.
12. **No `text-blue-500` Tailwind defaults.** Semantic tokens only.
13. **NEVER use local `/public/uploads/` for user-uploaded images.** UploadThing only.

### Required Visual Patterns

1. **Event cards = poster-heavy** (`.card .card-int`). Image dominates; serif
   title, genre·date, price-from + garnet CTA below. Editorial numeral or
   premiere flag in the top corner.
2. **Seat map = data-driven from `hall-config.ts`.** Seats colored by tier
   (premium=garnet, standard=gold, economy=ink-soft, balcony=ember — provisional,
   tuned in D3). Hover highlights gold; selected = garnet-dark.
3. **Sticky bottom CTA on mobile** — price-from + "Buy ticket" bar, slides in.
4. **Hold timer always visible** on seat selection and checkout, format "9:47".
5. **Currency** — always `4 000 ₸` (thin/regular space thousands separator, `₸`).
   Never `KZT 4000` or `4000тг`.
6. **Dates** — locale-aware via `Intl.DateTimeFormat`. KZ/RU/UG localized:
   - RU: `12 октября, суббота, 19:00`
   - KZ: `12 қазан, сенбі, 19:00`
   - UG: respect Cyrillic Uyghur conventions

---

## 5. Code Conventions

### TypeScript

- `strict: true`. No `any` without a comment explaining why.
- Prefer `type` over `interface` for shapes; `interface` only for declaration merging.
- Use Zod schemas at every trust boundary (form input, API request, env vars).
- Infer types from Zod schemas: `type CheckoutInput = z.infer<typeof checkoutSchema>`.

### Naming

- Components: `PascalCase` (`SeatMap.tsx`, `EventCard.tsx`)
- Functions and variables: `camelCase`
- Constants: `SCREAMING_SNAKE_CASE` (only for module-level constants)
- Files for components: `PascalCase.tsx`
- Files for utilities, lib code: `kebab-case.ts`
- Route segments: lowercase (`/events`, `/checkout`)

### Imports

Use path aliases configured in `tsconfig.json`:
- `@/lib/...`, `@/components/...`, `@/app/...`

Never relative imports above one level (`../../lib` is forbidden — use `@/lib`).

### Server vs Client Components

- **Default to Server Components.** A component is client only if it needs: state, effects, browser APIs, event handlers.
- Mark client explicitly with `"use client"` at the top.
- Pass server data to client components as props — never re-fetch on the client what was already fetched on the server.
- For forms: client component, but data submission via Server Actions when possible.

### Data Fetching

- Use Prisma directly in Server Components — no API routes for internal fetching.
- API routes only for: webhooks, cron, external integrations.
- Cache Prisma reads in Server Components with `unstable_cache` for catalog data.

### Error Handling

- User-facing errors: toast via shadcn `<Sonner />`, localized.
- Form errors: inline below the field via react-hook-form.
- Never log raw error messages to the user — log internally, show generic message.

---

## 5b. Admin Patterns

- For any form that edits sale-affecting data (Show prices/dates, Event metadata that touches existing bookings), always check `_count` of related records **server-side**. Render locked UI states based on this check — never trust client-side flags.
- Server actions that mutate data with sales constraints must **re-fetch and re-validate inside the transaction**. Do not trust the input payload's view of "this show has no tickets" — the count can change between page load and submit.
- **Destructive cascades** (e.g. cancelling a show) run as a single `db.$transaction` that flips every dependent record in one shot: Show → `CANCELLED`, PAID bookings → `REFUNDED` (tickets → `REFUNDED`, payments → `REFUNDED` + `refundedAt`/`refundReason`), PENDING bookings → `EXPIRED`, and ShowSeat rows deleted. Refund amounts use the **snapshotted ticket price**, never the live `Show` price.
- **Refunds are DB-only stubs** until the payment-provider session — set `Payment.status = REFUNDED` + `refundedAt` + `refundReason`; real Kaspi/Epay refund API calls come later.
- **Every admin mutation that affects bookings writes an `AuditLog` row** inside the same transaction. Real field names are `userId` / `action` / `entityType` / `entityId` / `details` (Json) — there is no `actorId`/`targetType`/`targetId`/`payload`. Make `details` rich enough for later sessions to backfill customer notifications.
- After a mutation, `revalidatePath` every affected route: the admin event detail + list, and the public `/{locale}/events/{slug}` for all three locales.
- **Single-booking refund** (`refundBookingAction`) mirrors the cancel-show cascade but scoped to one booking: booking → `REFUNDED`, its tickets → `REFUNDED`, its `SUCCEEDED` payments → `REFUNDED` (+ `refundedAt`/`refundReason`/`refundedAmount`), and the booking's exact `ShowSeat` rows **deleted** (match by `{zoneId,row,seat}` tuples, never flip to AVAILABLE). `refundedAmount` = `booking.total` (real money paid, after discount). Idempotent: re-running on a `REFUNDED` booking is a no-op error; only `PAID` bookings are refundable. Writes an `AuditLog` (`action="REFUND_BOOKING"`) with `refundedSeats` rich enough for Session 8 notifications. Revalidate `/admin/bookings`, `/admin/bookings/{id}`, `/admin/events/{eventId}`, and `/{locale}/shows/{showId}/seats` (×3 locales — seats are free again).
- **Admin list filters live in URL search params**, parsed server-side with a `.catch()`-tolerant Zod schema (a stale/hand-edited URL must never throw — it falls back per field). Client filter controls write the URL via `router.replace(..., { scroll: false })` and reset `page` on any filter change; the search box is debounced (~300ms). Pagination is offset-based (`PAGE_SIZE`), preserving all other params.

## 6. Internationalization

Three locales: `kz`, `ru`, `ug`. **Russian is the default** (most Kazakhstan users default to Russian).

```tsx
// CORRECT
const t = useTranslations("events");
<h2>{t("upcomingShows")}</h2>

// WRONG
<h2>Предстоящие показы</h2>
```

- All user-facing strings go in `messages/{locale}.json`.
- Database fields with translatable content use separate columns (`titleKz`, `titleRu`, `titleUg`).
- Form labels, button text, error messages — all translated.
- For UI placeholders during development, mark with `// TODO: translate` and add to RU first.

URL structure: `/[locale]/...`. Admin and kassa are NOT localized — they're internal staff tools, Russian-only is acceptable for v1.

---

## 7. Database & Data Rules

### Prisma

- Schema lives in `prisma/schema.prisma`. Never modify outside this file.
- Run migrations: `npx prisma migrate dev --name <descriptive_name>`.
- Always run `npx prisma generate` after schema changes.
- Use `select` to limit fields in queries — never fetch full models when only 2 fields are needed.

### Seat State Logic

`ShowSeat` rows exist ONLY when seat is not AVAILABLE. Implications:
- To check if a seat is free: `findUnique({ where: { showId_zoneId_row_seat } })` → if null, seat is free.
- When a hold expires or booking is cancelled: **delete** the `ShowSeat` row, don't update to AVAILABLE.
- Cron job `/api/cron/release-expired-holds` runs every minute, deletes rows where `status=HELD` and `holdExpiresAt < now()`.

### Pricing Logic

Per-show prices live in `Show.pricePremium / priceStandard / priceEconomy / priceBalcony`. To find a seat's price:
1. Get zone+row from `hall-config.ts` → look up `tier`.
2. Look up `Show[price${Tier}]`.
3. **Never** read price from `hall-config.DEFAULT_TIER_PRICES` at runtime — that's only the default for new shows in the admin form.

### Transactions

Wrap multi-step operations in `prisma.$transaction`:
- Creating a Booking + ShowSeats + Tickets must be atomic.
- Refund: marking Booking as REFUNDED + deleting/updating ShowSeats + updating Tickets must be atomic.

---

## 8. Payment Flow

1. User completes form on `/checkout/[bookingId]` → submits to Server Action.
2. Server Action: validate Zod schema, verify Booking still PENDING, verify seats still HELD by this session.
3. Call Kaspi Pay API (or Epay if user picked it) → get redirect URL.
4. Redirect user to provider URL.
5. Provider redirects user back to `/checkout/[bookingId]/success?status=...`.
6. Provider sends webhook to `/api/webhooks/kaspi` (or `/epay`) — webhook is the source of truth, redirect is just UX.
7. Webhook handler: verify signature, update Booking to PAID, convert ShowSeats from HELD to BOOKED, create Tickets, generate QR codes, queue email + SMS.

**Critical:** Never trust the redirect to confirm payment. Always wait for webhook before issuing tickets.

---

## 9. Workflow Rules for Claude Code

When starting a new task in this project:

1. **Read this file.**
2. **Open the relevant source-of-truth file** (hall-config, design-tokens, schema.prisma) before writing.
3. **Check `messages/ru.json`** if generating any UI with text.
4. **Ask before:**
   - Adding any new npm package
   - Creating any page not in the sitemap (see section 2)
   - Modifying `prisma/schema.prisma`
   - Editing `lib/hall-config.ts` or `lib/design-tokens.ts`
   - Adding a third color outside the brand palette
   - Using a fifth font size outside the design tokens
5. **Always include in every PR-sized change:**
   - Localized strings added to all three locale files (KZ/RU/UG — use Russian for missing translations, mark `// TODO: translate`)
   - Zod schema for any new form
   - Loading state (skeleton) for any data fetch
   - Empty state for any list

When stuck on design:
- **Ask the user for a screenshot** rather than guessing.
- Reference the visual style of Yandex.Afisha (clean, dense, no decoration).
- Reference the flow of Ticketon.kz (step structure, what info goes where).

When unsure about a copy:
- Default to Russian.
- Phrase like a transactional product, not a marketing site. "Купить билет" — not "Получите свой билет прямо сейчас!".

---

## 10. Mobile-First Hard Rules

This site will be used heavily on phones. Mobile is the primary target, desktop is enhancement.

- Tap targets minimum 44×44px.
- Forms: single-column on mobile, never side-by-side inputs.
- Seat map on mobile: pinch-zoom + pan support, seats must be tappable individually (≥24px each at default zoom).
- Sticky bottom CTA bar on mobile for primary action.
- Never use hover-only interactions for critical flows.
- Test every page at 375px width (iPhone SE).

---

## 11. Performance

- All event posters served via `next/image` with `priority` only on the first 4 cards above the fold.
- Avoid client-side data fetching for SEO-critical pages (use Server Components).
- Cache catalog reads with `unstable_cache` keyed by locale + filters.
- Webhooks and cron endpoints: keep under 5s response time.

---

## 12. Quality Bar

Before considering a session complete:

- TypeScript compiles with no errors (`tsc --noEmit`)
- No ESLint errors
- Page renders in all three locales without missing translations
- Forms validate with Zod and show errors inline
- Loading states exist for all data-fetching components
- The screen at 375px width is usable (no horizontal scroll, no clipped CTAs)
- No `console.log` left in code (use proper logging or delete)

---

## 13. What This Project Is Not

- Not a CMS. Content management is the admin panel, not headless CMS.
- Not multi-tenant. One theater, hardcoded.
- Not a marketplace. Direct sales only, no resale, no transfers.
- Not a loyalty platform. No customer accounts, no points, no rewards.

If a feature request would make this site any of the above — flag it, ask the user before building.

---

## End of CLAUDE.md

When in doubt, ask the user.
When still in doubt, default to: simple > complex, server > client, flat > layered, brand palette > inventing colors, paste a screenshot > write CSS from imagination.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
