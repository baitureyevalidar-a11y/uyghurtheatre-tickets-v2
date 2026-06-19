"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { refundBookingAction } from "@/app/admin/(dashboard)/bookings/[id]/actions";
import { RefundBookingDialog } from "./RefundBookingDialog";

type BookingRefundActionProps = {
  booking: {
    id: string;
    customerName: string;
    customerPhone: string;
    ticketsCount: number;
    totalAmount: number;
    showTitle: string;
    showStartsAt: Date;
  };
};

/** PAID-only footer control: opens the confirm dialog, runs the refund action. */
export function BookingRefundAction({ booking }: BookingRefundActionProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    const res = await refundBookingAction(booking.id);
    setOpen(false);
    if (res.ok) {
      // Re-pull server data so the page flips to its Refunded state.
      router.refresh();
    } else {
      setError(res.error);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      {error && <p className="text-sm text-state-error">{error}</p>}
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className="inline-flex h-11 items-center gap-2 rounded-md bg-state-error px-5 text-sm font-medium text-white transition-colors hover:bg-state-error/90"
      >
        <RotateCcw className="h-4 w-4" aria-hidden />
        Вернуть деньги
      </button>

      <RefundBookingDialog
        booking={booking}
        open={open}
        onOpenChange={setOpen}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
