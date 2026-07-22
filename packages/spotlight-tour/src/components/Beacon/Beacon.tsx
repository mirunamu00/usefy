import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { clsx } from "clsx";
import { useLatest } from "@usefy/use-latest";
import { useMutationObserver } from "@usefy/use-mutation-observer";
import { useReducedMotion } from "@usefy/use-reduced-motion";
import { resolveTarget } from "../../engine/resolveTarget";
import { useTargetRect } from "../../hooks/useTargetRect";
import { MUTATION_RERESOLVE_THROTTLE_MS } from "../../useSpotlightTour";
import type { TourTarget } from "../../types";
import styles from "./Beacon.module.scss";

/** Props for {@link SpotlightBeacon}. */
export interface SpotlightBeaconProps {
  /** Element the beacon attaches to (selector / ref / function). */
  target: TourTarget;
  /** Called on click — typically `() => controller.current?.start(2)`. */
  onActivate: () => void;
  /** Accessible name of the beacon button. @default "Start tour" */
  "aria-label"?: string;
  /** Extra class on the beacon button. */
  className?: string;
}

/**
 * A pulsing invitation dot pinned to an element's top-right corner — the
 * classic "psst, there's a tour here" affordance. A real `<button>` (portal
 * into `document.body`), so it is keyboard-focusable and screen-reader
 * announceable (`aria-label`, default "Start tour").
 *
 * Behavior:
 * - Tracks the target's live position via the same rAF-batched rect tracking
 *   the tour uses (scroll/resize/element resize).
 * - Renders **nothing** while the target is unresolved, and re-resolves on
 *   DOM mutation (throttled) — it appears when a late target mounts and
 *   disappears if the target unmounts.
 * - The pulse is pure CSS; under reduced motion it renders a static halo.
 * - SSR-safe: portals only after mount.
 *
 * Styled-entry export only (`@usefy/spotlight-tour`) — headless consumers can
 * build their own from `useTargetRect` + `resolveTarget`.
 *
 * @example
 * ```tsx
 * import { useRef } from "react";
 * import { SpotlightTour, SpotlightBeacon, type TourController } from "@usefy/spotlight-tour";
 *
 * function App() {
 *   const controller = useRef<TourController>(null);
 *   return (
 *     <>
 *       <SpotlightBeacon target="#search" onActivate={() => controller.current?.start()} />
 *       <SpotlightTour controllerRef={controller} steps={[{ target: "#search", content: "Search!" }]} />
 *     </>
 *   );
 * }
 * ```
 */
export function SpotlightBeacon(props: SpotlightBeaconProps): React.ReactNode {
  const {
    target,
    onActivate,
    "aria-label": ariaLabel = "Start tour",
    className,
  } = props;

  // Portal only after mount (SSR-safe).
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const targetRef = useLatest(target);
  const [element, setElement] = useState<Element | null>(null);

  // Initial resolution (and on target prop change). `setElement` bails on
  // identical values, so an inline function/ref target never loops.
  useEffect(() => {
    if (!mounted) return;
    setElement(resolveTarget(targetRef.current));
  }, [mounted, target, targetRef]);

  // Re-resolve on DOM mutation (throttled): a late-mounting target makes the
  // beacon appear; an unmounting one clears it (resolveTarget treats
  // disconnected nodes as unresolved).
  const throttleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { observe, disconnect } = useMutationObserver({
    childList: true,
    subtree: true,
    updateState: false,
    enabled: mounted,
    onMutation: () => {
      if (throttleRef.current !== null) return;
      throttleRef.current = setTimeout(() => {
        throttleRef.current = null;
        const next = resolveTarget(targetRef.current);
        setElement((prev) => (prev === next ? prev : next));
      }, MUTATION_RERESOLVE_THROTTLE_MS);
    },
  });
  useEffect(() => {
    if (!mounted || typeof document === "undefined") return;
    observe(document.body);
    return () => {
      disconnect();
      if (throttleRef.current !== null) {
        clearTimeout(throttleRef.current);
        throttleRef.current = null;
      }
    };
  }, [mounted, observe, disconnect]);

  const rect = useTargetRect(element);
  const reducedMotion = useReducedMotion();

  if (!mounted || !rect) return null;
  // An all-zero rect means the target isn't really visible (display:none, or
  // a detached-node measurement) — don't pin a beacon to the viewport origin.
  if (rect.x === 0 && rect.y === 0 && rect.width === 0 && rect.height === 0) {
    return null;
  }

  return createPortal(
    <button
      type="button"
      className={clsx(styles.beacon, reducedMotion && styles.static, className)}
      // Centered on the target's top-right corner, tracking live.
      style={{ left: rect.x + rect.width, top: rect.y }}
      aria-label={ariaLabel}
      onClick={onActivate}
      data-tour-beacon=""
    />,
    document.body
  );
}

SpotlightBeacon.displayName = "SpotlightBeacon";
