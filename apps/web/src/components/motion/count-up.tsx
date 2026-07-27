"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useIntersectionObserver } from "@usefy/use-intersection-observer";
import { useReducedMotion } from "@usefy/use-reduced-motion";

/**
 * Counts up to `to` when scrolled into view. Dogfoods
 * use-intersection-observer + use-reduced-motion.
 *
 * The server renders the real value — crawlers and no-JS visitors must never
 * see "0 hooks". Only once JS is running (and motion is allowed) do we reset
 * to 0 before first paint and animate up on viewport entry.
 */
export function CountUp({
  to,
  duration = 1100,
  className,
}: {
  to: number;
  duration?: number;
  className?: string;
}) {
  // triggerOnce: the first entry is all we need. Without it `inView` flips back
  // to false on scroll-out, which would tear the observer's state back down.
  const { ref, inView } = useIntersectionObserver({ threshold: 0.4, triggerOnce: true });
  const reducedMotion = useReducedMotion();
  const [value, setValue] = useState(to);
  const armed = useRef(false);
  // Latched in state, never read from `inView` directly: the count must survive
  // being scrolled out of view mid-animation instead of freezing part-way.
  const [started, setStarted] = useState(false);

  // Pre-paint: JS is definitely running, so it's safe to arm the animation.
  useLayoutEffect(() => {
    if (armed.current) return;
    armed.current = true;
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) setValue(0);
  }, []);

  useEffect(() => {
    if (inView) setStarted(true);
  }, [inView]);

  useEffect(() => {
    if (!started) return;

    if (reducedMotion) {
      setValue(to);
      return;
    }

    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(to * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, reducedMotion, to, duration]);

  return (
    <span ref={ref} className={className}>
      {value}
    </span>
  );
}
