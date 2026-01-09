import React, { forwardRef } from "react";
import { cn } from "../../utils/cn";
import type { PanelPosition } from "../../types";
import { ANIMATION_DURATION, Z_INDEX } from "../../constants";

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

// Lookup tables for position-based styles (Tailwind requires complete class strings)
const positionStyles = {
  right: {
    position: "right-0",
    border: "border-l",
    openTransform: "translate-x-0",
    closedTransform: "translate-x-full",
  },
  left: {
    position: "left-0",
    border: "border-r",
    openTransform: "translate-x-0",
    closedTransform: "-translate-x-full",
  },
} as const;

/**
 * Thin overlay scrollbar styles
 * - Uses overlay so scrollbar doesn't affect content width
 * - Thin and subtle appearance
 */
const thinScrollbarStyles = `
  .thin-scrollbar {
    overflow-y: auto;
    overflow-y: overlay; /* Overlay scrollbar - doesn't affect layout */
  }
  .thin-scrollbar::-webkit-scrollbar {
    width: 6px;
    background: transparent;
  }
  .thin-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .thin-scrollbar::-webkit-scrollbar-thumb {
    background-color: rgba(148, 163, 184, 0);
    border-radius: 6px;
    transition: background-color 0.2s ease;
  }
  .thin-scrollbar:hover::-webkit-scrollbar-thumb {
    background-color: rgba(148, 163, 184, 0.4);
  }
  .thin-scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: rgba(148, 163, 184, 0.6);
  }
`;

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
    const styles = positionStyles[position];

    return (
      <>
        {/* Backdrop */}
        {showBackdrop && (
          <div
            className={cn(
              "fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity",
              isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
            style={{
              zIndex: zIndex - 1,
              transitionDuration: `${ANIMATION_DURATION.panelSlide}ms`,
            }}
            onClick={onBackdropClick}
            aria-hidden="true"
          />
        )}

        {/* Thin scrollbar styles for webkit browsers */}
        <style>{thinScrollbarStyles}</style>

        {/* Panel */}
        <div
          ref={ref}
          role="dialog"
          aria-label="Memory Monitor Panel"
          aria-modal={showBackdrop}
          aria-hidden={!isOpen}
          className={cn(
            // Dark mode class must be on outer element for Tailwind dark: variants to work on children
            isDark && "dark",
            // Base styles
            "fixed top-0 bottom-0 flex flex-col",
            "transition-transform ease-out",
            // Position-based styles (from lookup table)
            styles.position,
            // Transform based on open state (from lookup table)
            isOpen ? styles.openTransform : styles.closedTransform,
            className
          )}
          style={{
            width: `${width}px`,
            zIndex,
            transitionDuration: `${ANIMATION_DURATION.panelSlide}ms`,
          }}
        >
          {/* Inner wrapper with theme-aware styles */}
          <div
            className={cn(
              "flex flex-col h-full",
              "bg-white/95 dark:bg-slate-900/95 backdrop-blur-md", // Glassmorphism effect
              "shadow-2xl shadow-slate-200/50 dark:shadow-black/50", // Enhanced shadow
              "border-slate-200 dark:border-slate-800",
              styles.border
            )}
          >
            {children}
          </div>
        </div>
      </>
    );
  }
);

Panel.displayName = "Panel";
