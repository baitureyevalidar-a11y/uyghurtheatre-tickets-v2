/**
 * design-tokens.ts
 *
 * Single source of truth for the PUBLIC-side visual system (the "Imagine"
 * pomegranate/garnet redesign — Session D2). Values are ported verbatim from
 * design-source/files/01-theme.js (the `PALETTE` object + injected CSS).
 *
 * Runtime styling lives in app/globals.css `@theme` (Tailwind v4) and the
 * ported utility classes there — this file is the documented reference and the
 * place to read exact values from. Keep the two in sync.
 *
 * NOTE: the admin panel (app/admin/**) is a separate visual system and does
 * NOT consume these tokens.
 */

// ============================================================
// 1. PALETTE — 11 brand colors (exact, from 01-theme.js PALETTE)
// ============================================================

export const palette = {
  paper: "#faf6f0", // page / soft surface
  paper2: "#f3ebdf", // alt section background
  ink: "#241f1c", // primary text on light
  inkSoft: "#5c534c", // secondary text on light
  garnet: "#9c2f2a", // PRIMARY accent — all CTAs, links, active states
  garnetDk: "#7d2630", // CTA hover, deep accents
  ember: "#c1572f", // scarcity gradient stop
  gold: "#bf8f3f", // muted gold accent
  goldSoft: "#d8b878", // eyebrows / numerals on dark
  night: "#1a1410", // dark sections (hero, footer)
  night2: "#241c16", // alt dark
  line: "rgba(36,31,28,0.12)", // hairline borders on light
} as const;

// ============================================================
// 2. TYPOGRAPHY
// ============================================================

export const typography = {
  fontFamilies: {
    // Display / headings — PT Serif (italic used for editorial accents).
    serif: "'PT Serif', Georgia, 'Times New Roman', serif",
    // Body / UI — Inter.
    sans: "'Inter', system-ui, -apple-system, sans-serif",
    // Uyghur (RTL) — Naskh Arabic; falls back to Sans Arabic.
    arabic: "'Noto Naskh Arabic', 'Noto Sans Arabic', serif",
  },
  // Editorial scale used across the prototype (px).
  sizes: {
    eyebrow: 11,
    micro: 10.5,
    xs: 12,
    sm: 13.5,
    base: 15,
    lg: 18,
    h3: 21,
    h2: 34,
    h1: 52,
    hero: 72,
  },
  weights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const;

// ============================================================
// 3. RADII — match .card (18) / .cta (12) rounding from the bundle
// ============================================================

export const radii = {
  sm: 6,
  md: 12,
  lg: 18,
  xl: 24,
  full: 9999,
} as const;

// ============================================================
// 4. SHADOWS — named tokens (exact from injectTheme())
// ============================================================

export const shadows = {
  cta: "0 6px 20px -6px rgba(156,47,42,.55)",
  ctaHover: "0 10px 28px -8px rgba(156,47,42,.6)",
  card: "0 18px 40px -22px rgba(36,31,28,.45)",
  cardHover: "0 28px 50px -22px rgba(36,31,28,.55)",
  header: "0 1px 0 rgba(36,31,28,.08)",
} as const;

// ============================================================
// 5. MOTION — easing curves + durations (match bundle transitions)
// ============================================================

export const motion = {
  duration: {
    fast: "120ms", // CTA press
    base: "160ms", // card hover
    slow: "300ms", // sticky bar slide
    countUp: "1500ms", // stats count-up
  },
  easing: {
    default: "ease",
    out: "cubic-bezier(0, 0, 0.2, 1)",
    smooth: "cubic-bezier(0.16, 1, 0.3, 1)",
  },
} as const;

// ============================================================
// 6. HALL TIER COLORS — provisional garnet-palette defaults
// ============================================================
// Tuned for visibility on cream in D3 (seat-map rework). Reasonable for now.

export const hallTierColors = {
  premium: palette.garnet, // #9c2f2a
  standard: palette.gold, // #bf8f3f
  economy: palette.inkSoft, // #5c534c
  balcony: palette.ember, // #c1572f
} as const;

export type HallTier = keyof typeof hallTierColors;

// ============================================================
// Legacy aliases — preserve prior export names (no current importers, but
// keeps continuity if any reference site is added before the full migration).
// ============================================================

export const colors = palette;
export const fonts = typography.fontFamilies;
export const radius = radii;
