import * as React from "react";
import { clsx } from "clsx";
import styles from "./Arrow.module.scss";

/** Props for the internal {@link Arrow}. */
export interface ArrowProps {
  /** Anchor x, relative to the tooltip's top-left (from the engine). */
  x: number;
  /** Anchor y, relative to the tooltip's top-left (from the engine). */
  y: number;
  /** Resolved tooltip placement (orients the visible tip's border). */
  placement: string;
  /** Extra class (`classNames.arrow`). */
  className?: string;
}

/**
 * The tooltip arrow: a rotated square centered on the engine-computed anchor
 * point, which always lies on the tooltip edge facing the target. Purely
 * decorative (`aria-hidden`).
 *
 * @internal Rendered by the default tooltip UI; not part of the public API.
 */
export function Arrow(props: ArrowProps): React.ReactNode {
  const { x, y, placement, className } = props;
  return (
    <div
      className={clsx(styles.arrow, className)}
      style={{ left: x, top: y }}
      data-placement={placement}
      data-tour-arrow=""
      aria-hidden="true"
    />
  );
}

Arrow.displayName = "SpotlightTourArrow";
