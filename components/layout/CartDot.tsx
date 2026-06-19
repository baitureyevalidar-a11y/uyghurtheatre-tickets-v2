"use client";

type CartDotProps = {
  hasPending: boolean;
};

/** Small garnet indicator over the cart icon when the session has a live PENDING booking. */
export function CartDot({ hasPending }: CartDotProps) {
  if (!hasPending) return null;
  return (
    <span
      className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-garnet ring-2 ring-paper"
      aria-hidden
    />
  );
}
