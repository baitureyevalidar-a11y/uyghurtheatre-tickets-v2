import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";

const COOKIE_NAME = "uyg_session";
const COOKIE_MAX_AGE = 24 * 60 * 60; // 24 hours

/**
 * Returns the current anonymous session id, minting + persisting one if absent.
 * Writes a cookie — call ONLY from a Server Action or Route Handler (Next.js
 * forbids cookie mutation from a regular page Server Component).
 * Used as `ShowSeat.holdSessionId` so we can attribute holds back to a browser
 * without requiring customer auth (per CLAUDE.md — no customer accounts).
 */
export async function getOrCreateSessionId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(COOKIE_NAME)?.value;
  if (existing) return existing;

  const fresh = randomUUID();
  store.set(COOKIE_NAME, fresh, {
    maxAge: COOKIE_MAX_AGE,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  return fresh;
}

/** Read-only counterpart for page Server Components. Returns undefined if no session yet. */
export async function readSessionId(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value;
}
