"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@usefy/use-reduced-motion";

/**
 * The hero backdrop: the blueprint grid plus a cursor-following spotlight —
 * a quiet nod to @usefy/spotlight-tour. Pointer tracking writes CSS vars in
 * rAF (no React re-renders); reduced motion drops the spotlight entirely.
 */
export function HeroBackdrop() {
  const ref = useRef<HTMLDivElement>(null);
  // initializeWithValue: false → first client render matches the server
  // markup (spotlight present), then the effect-applied real preference
  // removes it post-hydration. A synchronous read here changes the rendered
  // tree for reduced-motion visitors → React #418 hydration mismatch.
  const reducedMotion = useReducedMotion({ initializeWithValue: false });

  useEffect(() => {
    if (reducedMotion) return;
    const el = ref.current;
    // The wrapper is pointer-events-none (never hit-tested), so listen on the
    // hero <section> itself.
    const section = el?.closest("section");
    if (!el || !section) return;

    let raf = 0;
    let x = 0;
    let y = 0;

    const onMove = (e: Event) => {
      if (!(e instanceof PointerEvent) || e.pointerType !== "mouse") return;
      const rect = section.getBoundingClientRect();
      x = ((e.clientX - rect.left) / rect.width) * 100;
      y = ((e.clientY - rect.top) / rect.height) * 100;
      if (!raf) {
        raf = requestAnimationFrame(() => {
          el.style.setProperty("--spot-x", `${x}%`);
          el.style.setProperty("--spot-y", `${y}%`);
          raf = 0;
        });
      }
    };

    section.addEventListener("pointermove", onMove);
    return () => {
      section.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reducedMotion]);

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <div className="absolute inset-0 grid-bg" />
      {!reducedMotion && <div ref={ref} className="hero-spot absolute inset-0" />}
    </div>
  );
}
