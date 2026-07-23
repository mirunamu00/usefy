"use client";

import { useEffect, useState } from "react";
import { useIntersectionObserver } from "@usefy/use-intersection-observer";
import { cn } from "@/lib/cn";

/**
 * Scroll-reveal wrapper, driven by @usefy/use-intersection-observer. Adds
 * `.is-visible` once the element enters the viewport; the transition itself
 * lives in globals.css (gated on html.js so no-JS visitors see everything).
 */
export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  /** Stagger delay in seconds. */
  delay?: number;
  as?: "div" | "section" | "li" | "span";
}) {
  const { ref, inView } = useIntersectionObserver({
    threshold: 0.15,
    rootMargin: "0px 0px -32px 0px",
  });
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    if (inView) setSeen(true);
  }, [inView]);

  return (
    <Tag
      ref={ref}
      className={cn("reveal", (inView || seen) && "is-visible", className)}
      style={delay ? ({ "--reveal-delay": `${delay}s` } as React.CSSProperties) : undefined}
    >
      {children}
    </Tag>
  );
}
