"use client";

import { useEffect, useState } from "react";
import { useIntersectionObserver } from "@usefy/use-intersection-observer";
import { cn } from "@/lib/cn";

/**
 * A decorative "wire" that hooks two sections together — it draws itself in
 * when scrolled into view (stroke-dashoffset transition in globals.css).
 * Purely decorative; driven by @usefy/use-intersection-observer.
 */
export function WireDivider({ className }: { className?: string }) {
  const { ref, inView } = useIntersectionObserver({ threshold: 0.6 });
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    if (inView) setSeen(true);
  }, [inView]);

  return (
    <div ref={ref} aria-hidden="true" className={cn("wire flex justify-center", (inView || seen) && "is-visible", className)}>
      <svg width="64" height="88" viewBox="0 0 64 88" fill="none">
        <path
          d="M32 0 C32 20 16 24 16 40 C16 58 48 56 48 72 C48 83 38 86 32 82"
          stroke="var(--brand)"
          strokeOpacity="0.5"
          strokeWidth="1.5"
          strokeLinecap="round"
          pathLength="1"
        />
      </svg>
    </div>
  );
}
