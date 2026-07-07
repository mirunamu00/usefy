import React, { useCallback, useRef, useEffect } from "react";
import { clsx } from "clsx";
import { PANEL_DIMENSIONS } from "../../constants";
import type { PanelPosition } from "../../types";
import styles from "./PanelResizer.module.scss";

export interface PanelResizerProps {
  /** Current panel width */
  width: number;
  /** Width change handler */
  onWidthChange: (width: number) => void;
  /** Panel position */
  position?: PanelPosition;
  /** Minimum width */
  minWidth?: number;
  /** Maximum width */
  maxWidth?: number;
  /** Custom class name */
  className?: string;
}

/**
 * Drag handle for resizing the panel width
 */
export function PanelResizer({
  width,
  onWidthChange,
  position = "right",
  minWidth = PANEL_DIMENSIONS.minWidth,
  maxWidth = PANEL_DIMENSIONS.maxWidth,
  className,
}: PanelResizerProps) {
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDraggingRef.current = true;
      startXRef.current = e.clientX;
      startWidthRef.current = width;

      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [width]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;

      const deltaX = e.clientX - startXRef.current;
      // For right panel, dragging left increases width
      // For left panel, dragging right increases width
      const newWidth =
        position === "right"
          ? startWidthRef.current - deltaX
          : startWidthRef.current + deltaX;

      const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      onWidthChange(clampedWidth);
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [position, minWidth, maxWidth, onWidthChange]);

  const positionClass = position === "right" ? styles.positionRight : styles.positionLeft;

  return (
    <div
      className={clsx(styles.resizer, positionClass, className)}
      onMouseDown={handleMouseDown}
      role="separator"
      aria-orientation="vertical"
      aria-valuemin={minWidth}
      aria-valuemax={maxWidth}
      aria-valuenow={width}
      tabIndex={0}
    >
      {/* Visual indicator on hover */}
      <div className={styles.indicator} />
    </div>
  );
}

PanelResizer.displayName = "PanelResizer";
