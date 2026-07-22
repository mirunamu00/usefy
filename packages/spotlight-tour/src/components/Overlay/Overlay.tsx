import * as React from "react";
import { useId } from "react";
import { clsx } from "clsx";
import type { Rect } from "../../types";
import styles from "./Overlay.module.scss";

/** Props for the internal {@link Overlay}. */
export interface OverlayProps {
  /** Spotlight hole geometry, or `null` for a centered step (no hole). */
  spotlight: (Rect & { radius: number }) | null;
  /** Dim layer color. */
  maskColor: string;
  /** Effective transition duration in ms (0 disables the hole animation). */
  transitionDuration: number;
  /** Whether clicks pass through the hole to the target underneath. */
  spotlightClicks: boolean;
  /** Called when the dimmed area is clicked; omit for `overlayClick: 'ignore'`. */
  onOverlayClick?: () => void;
  /** A11y props from `getOverlayProps()`. */
  overlayProps: React.HTMLAttributes<HTMLElement>;
  /** Extra class on the overlay root (`classNames.overlay`). */
  className?: string;
  /** Extra class on the spotlight hole rect (`classNames.spotlight`). */
  spotlightClassName?: string;
}

/**
 * The dim overlay with an SVG-mask spotlight hole (SPEC §5.4): one
 * full-viewport `<rect>` painted in `maskColor`, masked by a white full-screen
 * rect minus a black rounded hole rect. The hole's geometry attributes are CSS
 * geometry properties, so a plain CSS transition animates the spotlight from
 * one step's target to the next — no per-frame React re-renders.
 *
 * **Pointer events**: the overlay layer itself is `pointer-events: none`; four
 * invisible "hit" strips around the hole (or one full-screen strip for
 * centered steps) opt back in, so the hole is a genuine hole — clicks inside
 * it reach the spotlighted element. `spotlightClicks: false` adds a blocker
 * strip over the hole that swallows clicks (without counting as an overlay
 * click).
 *
 * @internal Rendered by `SpotlightTour`; not part of the public API.
 */
export function Overlay(props: OverlayProps): React.ReactNode {
  const {
    spotlight,
    maskColor,
    transitionDuration,
    spotlightClicks,
    onOverlayClick,
    overlayProps,
    className,
    spotlightClassName,
  } = props;

  // useId can contain ':' which is awkward in url(#…) references — strip it.
  const rawId = useId();
  const maskId = `usefy-tour-mask-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const rootStyle = {
    "--usefy-tour-transition-duration": `${transitionDuration}ms`,
  } as React.CSSProperties;

  // Clamped hole box for the hit strips (the SVG mask may go negative at
  // viewport edges; the strips must not). Both edges are clamped: for a
  // partially-offscreen spotlight the visible hole is the intersection with
  // the viewport, so the strips must tile exactly viewport-minus-that —
  // clamping only left/top would shift the box and leave an unguarded band.
  let hole: { left: number; top: number; width: number; height: number } | null =
    null;
  if (spotlight) {
    const left = Math.max(spotlight.x, 0);
    const top = Math.max(spotlight.y, 0);
    const right = Math.max(spotlight.x + Math.max(spotlight.width, 0), left);
    const bottom = Math.max(spotlight.y + Math.max(spotlight.height, 0), top);
    hole = { left, top, width: right - left, height: bottom - top };
  }

  return (
    <div
      {...overlayProps}
      className={clsx(styles.overlay, className)}
      style={rootStyle}
      data-tour-overlay=""
    >
      <svg className={styles.svg} aria-hidden="true">
        <defs>
          <mask
            id={maskId}
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="100%"
            height="100%"
          >
            <rect x="0" y="0" width="100%" height="100%" fill="#fff" />
            {spotlight && (
              <rect
                className={clsx(styles.hole, spotlightClassName)}
                x={spotlight.x}
                y={spotlight.y}
                width={Math.max(spotlight.width, 0)}
                height={Math.max(spotlight.height, 0)}
                rx={spotlight.radius}
                ry={spotlight.radius}
                fill="#000"
                data-tour-spotlight=""
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill={maskColor}
          mask={`url(#${maskId})`}
          data-tour-dim=""
        />
      </svg>

      {hole ? (
        <>
          {/* Click-catching strips around the hole. */}
          <div
            className={styles.hit}
            style={{ left: 0, top: 0, right: 0, height: hole.top }}
            onClick={onOverlayClick}
            data-tour-hit="top"
          />
          <div
            className={styles.hit}
            style={{ left: 0, top: hole.top, width: hole.left, height: hole.height }}
            onClick={onOverlayClick}
            data-tour-hit="left"
          />
          <div
            className={styles.hit}
            style={{
              left: hole.left + hole.width,
              top: hole.top,
              right: 0,
              height: hole.height,
            }}
            onClick={onOverlayClick}
            data-tour-hit="right"
          />
          <div
            className={styles.hit}
            style={{ left: 0, top: hole.top + hole.height, right: 0, bottom: 0 }}
            onClick={onOverlayClick}
            data-tour-hit="bottom"
          />
          {!spotlightClicks && (
            <div
              className={styles.blocker}
              style={{
                left: hole.left,
                top: hole.top,
                width: hole.width,
                height: hole.height,
              }}
              data-tour-blocker=""
            />
          )}
        </>
      ) : (
        // Centered step: one full-screen catcher.
        <div
          className={styles.hit}
          style={{ inset: 0 }}
          onClick={onOverlayClick}
          data-tour-hit="full"
        />
      )}
    </div>
  );
}

Overlay.displayName = "SpotlightTourOverlay";
