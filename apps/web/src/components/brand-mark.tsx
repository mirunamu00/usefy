import { cn } from "@/lib/cn";

/** The usefy wordmark: the hook logo (indigo→violet) + name. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/hook-mark.png"
        alt=""
        aria-hidden="true"
        width={28}
        height={28}
        className="h-7 w-7"
      />
      <span translate="no" className="notranslate font-display text-lg font-semibold tracking-tight text-fg">usefy</span>
    </span>
  );
}
