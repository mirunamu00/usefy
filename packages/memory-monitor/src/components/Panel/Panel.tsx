import React, { forwardRef } from "react";
import { clsx } from "clsx";
import type { PanelPosition } from "../../types";
import { Z_INDEX } from "../../constants";
import styles from "./Panel.module.scss";

export interface PanelProps {
  /** Whether the panel is open */
  isOpen: boolean;
  /** Position of the panel */
  position?: PanelPosition;
  /** Panel width in pixels */
  width?: number;
  /** Z-index for the panel */
  zIndex?: number;
  /** Whether to show backdrop overlay */
  showBackdrop?: boolean;
  /** Callback when backdrop is clicked */
  onBackdropClick?: () => void;
  /** Custom class name */
  className?: string;
  /** Dark mode */
  isDark?: boolean;
  /** Panel content */
  children: React.ReactNode;
}

/**
 * Slide-in panel container component
 * Uses position: fixed for viewport-relative positioning
 */
export const Panel = forwardRef<HTMLDivElement, PanelProps>(
  (
    {
      isOpen,
      position = "right",
      width = 400,
      zIndex = Z_INDEX.panel,
      showBackdrop = false,
      onBackdropClick,
      className,
      isDark = false,
      children,
    },
    ref
  ) => {
    const positionClass = position === "right" ? styles.positionRight : styles.positionLeft;
    const closedClass = position === "right" ? styles.closedRight : styles.closedLeft;

    return (
      <>
        {/* Backdrop */}
        {showBackdrop && (
          <div
            className={clsx(
              styles.backdrop,
              isOpen ? styles.open : styles.closed
            )}
            style={{ zIndex: zIndex - 1 }}
            onClick={onBackdropClick}
            aria-hidden="true"
          />
        )}

        {/* Panel */}
        <div
          ref={ref}
          role="dialog"
          aria-label="Memory Monitor Panel"
          aria-modal={showBackdrop}
          aria-hidden={!isOpen}
          data-position={position}
          className={clsx(
            styles.panel,
            positionClass,
            isOpen ? styles.open : closedClass,
            isDark && "dark",
            className
          )}
          style={{
            width: `${width}px`,
            zIndex,
          }}
        >
          {/* Inner wrapper with theme-aware styles */}
          <div className={clsx(styles.panelInner, isDark && styles.panelInnerDark)}>
            {children}
          </div>
        </div>
      </>
    );
  }
);

Panel.displayName = "Panel";
