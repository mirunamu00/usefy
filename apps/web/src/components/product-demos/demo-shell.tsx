"use client";

import { cn } from "@/lib/cn";

/** Shared frame for product-page live demos: accent hairline + stage. */
export function DemoShell({
  children,
  hint,
  className,
}: {
  children: React.ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface/40">
      <span className="block h-0.5 w-full" style={{ background: "var(--accent, var(--brand))" }} aria-hidden="true" />
      <div className={cn("p-5", className)}>{children}</div>
      {hint ? (
        <p className="border-t border-border px-5 py-2.5 font-mono text-[11px] text-fg-subtle">{hint}</p>
      ) : null}
    </div>
  );
}

/** A small accent-tinted action button used across the demos. */
export function DemoButton({
  onClick,
  children,
  primary = false,
  disabled = false,
}: {
  onClick: () => void;
  children: React.ReactNode;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "focusable inline-flex h-9 items-center rounded-lg px-4 text-sm font-medium transition-colors",
        primary
          ? "text-white"
          : "border border-border text-fg hover:border-border-strong",
        disabled && "cursor-not-allowed opacity-40",
      )}
      style={
        primary
          ? { background: "var(--accent, var(--brand))", color: "var(--bg)" }
          : undefined
      }
    >
      {children}
    </button>
  );
}
