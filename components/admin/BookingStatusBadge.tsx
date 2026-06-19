import type { BookingStatus } from "@prisma/client";
import { BOOKING_STATUS_LABELS } from "@/lib/validation/booking";

// PAID=green, PENDING=amber, EXPIRED/CANCELLED=gray, REFUNDED variants=red-tint.
const BADGE_CLASS: Record<BookingStatus, string> = {
  PAID: "bg-state-success-bg text-state-success",
  PENDING: "bg-state-warning-bg text-state-warning",
  EXPIRED: "bg-bg-muted text-text-secondary",
  CANCELLED: "bg-bg-muted text-text-secondary",
  REFUNDED: "bg-state-error-bg text-state-error",
  PARTIALLY_REFUNDED: "bg-state-error-bg text-state-error",
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${BADGE_CLASS[status]}`}
    >
      {BOOKING_STATUS_LABELS[status]}
    </span>
  );
}
