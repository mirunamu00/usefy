"use client";

/**
 * The full value of a truncated row (SPEC.md decision #4).
 *
 * An **overlay**, not a taller row. Every scroll offset in `useRowWindow` is
 * `index × rowHeight`; letting a row grow would invalidate all of them and put
 * this package back in measured-virtualization territory — the "different,
 * much larger problem" `@usefy/diff-viewer` documented and declined. Wrapping
 * the value across several fixed-height rows was the other candidate and is
 * worse still: the row count would then depend on the container's width, so a
 * resize would silently change `rowCount()`.
 */

import { useEffect, useRef } from "react";
import { useEventListener } from "@usefy/use-event-listener";
import { useOnClickOutside } from "@usefy/use-on-click-outside";
import styles from "./styles/JsonViewer.module.scss";

export interface ValueOverlayProps {
  text: string;
  /** Position within the viewer root, in pixels. */
  top: number;
  left: number;
  /** Row label, for the accessible name. */
  label: string;
  onCopy: () => void;
  onClose: () => void;
}

export function ValueOverlay({
  text,
  top,
  left,
  label,
  onCopy,
  onClose,
}: ValueOverlayProps) {
  const ref = useRef<HTMLDivElement>(null);

  useOnClickOutside(ref, onClose);
  useEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
    }
  });

  // Focus moves in so the value is reachable by keyboard and by a screen
  // reader; `JsonViewer` returns focus to the row that opened it.
  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={`Full value of ${label || "this node"}`}
      tabIndex={-1}
      className={styles.overlay}
      style={{ top, left }}
      data-testid="json-value-overlay"
    >
      <div className={styles.overlayBar}>
        <span>{`${text.length.toLocaleString()} characters`}</span>
        <button type="button" className={styles.button} onClick={onCopy}>
          Copy
        </button>
        <button type="button" className={styles.button} onClick={onClose}>
          Close
        </button>
      </div>
      <p className={styles.overlayText}>{text}</p>
    </div>
  );
}
