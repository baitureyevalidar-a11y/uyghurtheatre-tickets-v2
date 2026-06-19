"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

type CopyButtonProps = {
  value: string;
  /** Accessible label, e.g. "Скопировать ID брони". */
  label: string;
  className?: string;
};

/** Small icon button that copies `value` to the clipboard and flashes a check. */
export function CopyButton({ value, label, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be unavailable (insecure context) — fail silently.
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={label}
      title={label}
      className={
        "inline-flex h-6 w-6 items-center justify-center rounded text-text-tertiary transition-colors hover:bg-bg-elevated hover:text-brand-teal" +
        (className ? ` ${className}` : "")
      }
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-state-success" aria-hidden />
      ) : (
        <Copy className="h-3.5 w-3.5" aria-hidden />
      )}
    </button>
  );
}
