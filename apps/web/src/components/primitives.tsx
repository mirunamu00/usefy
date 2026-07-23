import { cn } from "@/lib/cn";

/** Centered max-width container. */
export function Container({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-6xl px-5 sm:px-8", className)} style={style}>
      {children}
    </div>
  );
}

/** Monospace, code-comment section eyebrow. */
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="eyebrow">{children}</p>;
}

/** A small brand pill / badge. */
export function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 font-mono text-xs text-fg-muted",
        className,
      )}
    >
      {children}
    </span>
  );
}
