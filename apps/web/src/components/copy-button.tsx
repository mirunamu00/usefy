"use client";

import { useCopyToClipboard } from "@usefy/use-copy-to-clipboard";
import { cn } from "@/lib/cn";

/**
 * Copy-to-clipboard button. Dogfoods @usefy/use-copy-to-clipboard — the same
 * hook this site documents.
 */
export function CopyButton({
  value,
  label = "Copy",
  className,
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copiedText, copy] = useCopyToClipboard();
  const copied = copiedText === value;

  return (
    <button
      type="button"
      onClick={() => void copy(value)}
      aria-label={copied ? "Copied to clipboard" : label}
      className={cn(
        "focusable inline-flex h-8 w-8 items-center justify-center rounded-md text-fg-subtle transition-colors hover:bg-white/10 hover:text-fg",
        className,
      )}
    >
      {copied ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="9" y="9" width="11" height="11" rx="2.4" stroke="currentColor" strokeWidth="1.8" />
          <path d="M5 15V5a2 2 0 0 1 2-2h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
}
