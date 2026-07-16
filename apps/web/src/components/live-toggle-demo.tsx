"use client";

import { useToggle } from "@usefy/use-toggle";

/**
 * The hero's live island — a real @usefy/use-toggle running in the page.
 * The code above it (rendered server-side) is exactly what drives this.
 */
export function LiveToggleDemo() {
  const { value, toggle } = useToggle(true);

  return (
    <div
      className="flex items-center justify-between gap-4 border-t px-4 py-3.5"
      style={{ borderColor: "var(--code-border)" }}
    >
      <div className="flex items-center gap-2.5 font-mono text-[13px]">
        <span className="text-white/35">value</span>
        <span
          className={
            "rounded-md px-2 py-0.5 font-medium tabular-nums transition-colors " +
            (value ? "bg-brand/25 text-[#b9a6ff]" : "bg-white/10 text-white/50")
          }
        >
          {String(value)}
        </span>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-label="Toggle the demo value"
        onClick={toggle}
        className="focusable relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors"
        style={{ background: value ? "var(--brand)" : "rgba(255,255,255,0.16)" }}
      >
        <span
          className="inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform"
          style={{ transform: value ? "translateX(22px)" : "translateX(3px)" }}
        />
      </button>
    </div>
  );
}
