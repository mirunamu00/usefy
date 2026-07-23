import { cn } from "@/lib/cn";

/**
 * The usefy wordmark: the hook badge (indigo→violet) + name, as inline SVG so
 * it stays crisp at any size, follows the theme's gradient tokens, and the
 * hook glyph can swing on hover (see .brand-hook in globals.css).
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn("brand-hook inline-flex items-center gap-2", className)}>
      <svg
        width={28}
        height={28}
        viewBox="0 0 64 64"
        aria-hidden="true"
        className="h-7 w-7"
      >
        <defs>
          <linearGradient id="hook-badge" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" style={{ stopColor: "var(--brand-from)" }} />
            <stop offset="1" style={{ stopColor: "var(--brand-to)" }} />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="18" fill="url(#hook-badge)" />
        <g
          className="hook-glyph"
          fill="none"
          stroke="#ffffff"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="22.5" cy="17.5" r="4.25" strokeWidth="4" />
          <path
            d="M23.5 22.5 C26.5 33 30.5 41.5 37 45.5 C43.5 49.5 49.5 45 49 38 L48.5 33.5"
            strokeWidth="5.5"
          />
          <path d="M48.5 34 L43.5 38" strokeWidth="4.5" />
        </g>
      </svg>
      <span translate="no" className="notranslate font-display text-lg font-semibold tracking-tight text-fg">usefy</span>
    </span>
  );
}
