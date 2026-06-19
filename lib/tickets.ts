import { randomBytes } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import QRCode from "qrcode";

function getSecret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set — required for QR JWT signing.");
  return new TextEncoder().encode(s);
}

// Crockford-style alphabet — no 0/O/1/I to avoid scanner / human confusion.
const TICKET_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const ISSUER = "uyg-theater";

/** Human-readable, scannable code printed on tickets. Format: `UYG-XXXXXX`. */
export function generateTicketCode(): string {
  const bytes = randomBytes(6);
  let code = "";
  for (const b of bytes) code += TICKET_CODE_CHARS[b % TICKET_CODE_CHARS.length];
  return `UYG-${code}`;
}

export type QrPayload = {
  ticketCode: string;
  bookingId: string;
  showId: string;
};

/** Signed JWT embedded in the QR. The cashier scanner will verify with `verifyQrPayload`. */
export async function generateQrPayload(data: QrPayload): Promise<string> {
  return await new SignJWT({ ...data })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .sign(getSecret());
}

export async function verifyQrPayload(jwt: string): Promise<QrPayload> {
  const { payload } = await jwtVerify(jwt, getSecret(), { issuer: ISSUER });
  return {
    ticketCode: String(payload.ticketCode),
    bookingId: String(payload.bookingId),
    showId: String(payload.showId),
  };
}

/** Server-side PNG data URL — inline `<img src={...} />` ready. Brand-colored. */
export async function generateQrImageDataUrl(payload: string): Promise<string> {
  return await QRCode.toDataURL(payload, {
    margin: 1,
    width: 280,
    color: { dark: "#0F4444", light: "#FFFFFF" },
  });
}
