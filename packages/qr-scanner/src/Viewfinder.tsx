"use client";

import { useEffect, useId, useRef } from "react";
import { useReducedMotion } from "@usefy/use-reduced-motion";
import { cornersToPolygon, mapCorners, type ElementGeometry } from "./utils";
import type { QRScanResult } from "./types";

/**
 * The viewfinder: corner brackets, a sweeping line, and a highlight that
 * tracks whatever the decoder found.
 *
 * All SVG and inline styles — no stylesheet ships with this package — and the
 * sweep is driven by the Web Animations API rather than CSS keyframes, which
 * is what lets a component with no CSS file animate at all.
 */

export interface ViewfinderProps {
  /** The most recent decode, drawn as a highlight quad. */
  result: QRScanResult | null;
  /** How the video's pixels map into the element (see {@link mapCorners}). */
  geometry: ElementGeometry | null;
  /** Accent used for the brackets, the sweep and the highlight. */
  accent: string;
  /** Whether the sweep should run at all (paused scanners hold still). */
  active: boolean;
}

/** Fraction of the shorter side the viewfinder square occupies. */
const FRAME_RATIO = 0.68;

export function Viewfinder({ result, geometry, accent, active }: ViewfinderProps): React.ReactNode {
  const reducedMotion = useReducedMotion();
  const sweepRef = useRef<SVGRectElement | null>(null);
  const animationRef = useRef<Animation | null>(null);
  // `url(#…)` resolves document-wide to the *first* matching element, so a
  // hard-coded id means a second scanner on the page (a preview beside a modal,
  // two demos on one product page) renders the first one's cutout geometry —
  // a dim rectangle with the hole in the wrong place.
  const maskId = `usefy-qr-viewfinder-${useId()}`;

  const width = geometry?.elementWidth ?? 0;
  const height = geometry?.elementHeight ?? 0;
  const side = Math.min(width, height) * FRAME_RATIO;
  const left = (width - side) / 2;
  const top = (height - side) / 2;
  const corner = Math.max(12, side * 0.12);

  useEffect(() => {
    const element = sweepRef.current;
    animationRef.current?.cancel();
    animationRef.current = null;

    // Under reduced motion the sweep does not slow down — it stops, and the
    // brackets alone carry the "aim here" message. A slowed sweep is still
    // motion, and the preference is not "less", it is "none".
    if (!element || !active || reducedMotion || side <= 0) return;
    if (typeof element.animate !== "function") return;

    animationRef.current = element.animate(
      [
        { transform: `translateY(0px)`, opacity: 0 },
        { transform: `translateY(${side * 0.12}px)`, opacity: 1, offset: 0.15 },
        { transform: `translateY(${side * 0.88}px)`, opacity: 1, offset: 0.85 },
        { transform: `translateY(${side}px)`, opacity: 0 },
      ],
      { duration: 2400, iterations: Infinity, easing: "cubic-bezier(0.4, 0, 0.2, 1)" },
    );

    return () => {
      animationRef.current?.cancel();
      animationRef.current = null;
    };
  }, [active, reducedMotion, side]);

  if (!geometry || side <= 0) return null;

  const highlight = result && geometry ? mapCorners(result, geometry) : null;

  const bracket = (x: number, y: number, dx: number, dy: number): string =>
    `M ${x + dx * corner} ${y} L ${x} ${y} L ${x} ${y + dy * corner}`;

  return (
    <svg
      aria-hidden="true"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    >
      {/* Everything outside the viewfinder is dimmed, so the eye goes to the
          square without the square needing a heavy border. */}
      <mask id={maskId}>
        <rect x={0} y={0} width={width} height={height} fill="white" />
        <rect x={left} y={top} width={side} height={side} rx={side * 0.06} fill="black" />
      </mask>
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill="rgba(0, 0, 0, 0.45)"
        mask={`url(#${maskId})`}
      />

      <g stroke={accent} strokeWidth={3} strokeLinecap="round" fill="none">
        <path d={bracket(left, top, 1, 1)} />
        <path d={bracket(left + side, top, -1, 1)} />
        <path d={bracket(left, top + side, 1, -1)} />
        <path d={bracket(left + side, top + side, -1, -1)} />
      </g>

      <rect
        ref={sweepRef}
        x={left + 4}
        y={top}
        width={side - 8}
        height={2}
        rx={1}
        fill={accent}
        opacity={0}
      />

      {highlight && (
        <polygon
          points={cornersToPolygon(highlight)}
          fill={accent}
          fillOpacity={0.18}
          stroke={accent}
          strokeWidth={3}
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}
