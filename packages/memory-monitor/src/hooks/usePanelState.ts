import { useState, useCallback } from "react";
import type { PanelTab, PanelState } from "../types";

/**
 * Options for usePanelState hook
 */
export interface UsePanelStateOptions {
  /** Initial open state */
  defaultOpen?: boolean;
  /** Initial active tab */
  defaultTab?: PanelTab;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
}

/**
 * Return type for usePanelState hook
 */
export interface UsePanelStateReturn {
  /** Current panel state */
  state: PanelState;
  /** Whether the panel is open */
  isOpen: boolean;
  /** Currently active tab */
  activeTab: PanelTab;
  /** List of expanded section IDs */
  expandedSections: string[];
  /** Open the panel */
  open: () => void;
  /** Close the panel */
  close: () => void;
  /** Toggle the panel open/closed */
  toggle: () => void;
  /** Set the active tab */
  setActiveTab: (tab: PanelTab) => void;
  /** Toggle a section's expanded state */
  toggleSection: (sectionId: string) => void;
  /** Check if a section is expanded */
  isSectionExpanded: (sectionId: string) => boolean;
}

/**
 * Hook to manage panel UI state
 *
 * @param options - Configuration options
 * @returns Panel state and control functions
 *
 * @example
 * ```tsx
 * const { isOpen, toggle, activeTab, setActiveTab } = usePanelState({
 *   defaultOpen: false,
 *   defaultTab: 'overview',
 * });
 * ```
 */
export function usePanelState(
  options: UsePanelStateOptions = {}
): UsePanelStateReturn {
  const { defaultOpen = false, defaultTab = "overview", onOpenChange } = options;

  const [state, setState] = useState<PanelState>({
    isOpen: defaultOpen,
    activeTab: defaultTab,
    expandedSections: ["memory", "status", "actions"], // Default expanded sections
  });

  const open = useCallback(() => {
    setState((prev) => {
      if (prev.isOpen) return prev;
      onOpenChange?.(true);
      return { ...prev, isOpen: true };
    });
  }, [onOpenChange]);

  const close = useCallback(() => {
    setState((prev) => {
      if (!prev.isOpen) return prev;
      onOpenChange?.(false);
      return { ...prev, isOpen: false };
    });
  }, [onOpenChange]);

  const toggle = useCallback(() => {
    setState((prev) => {
      const nextOpen = !prev.isOpen;
      onOpenChange?.(nextOpen);
      return { ...prev, isOpen: nextOpen };
    });
  }, [onOpenChange]);

  const setActiveTab = useCallback((tab: PanelTab) => {
    setState((prev) => {
      if (prev.activeTab === tab) return prev;
      return { ...prev, activeTab: tab };
    });
  }, []);

  const toggleSection = useCallback((sectionId: string) => {
    setState((prev) => {
      const isExpanded = prev.expandedSections.includes(sectionId);
      return {
        ...prev,
        expandedSections: isExpanded
          ? prev.expandedSections.filter((id) => id !== sectionId)
          : [...prev.expandedSections, sectionId],
      };
    });
  }, []);

  const isSectionExpanded = useCallback(
    (sectionId: string) => {
      return state.expandedSections.includes(sectionId);
    },
    [state.expandedSections]
  );

  return {
    state,
    isOpen: state.isOpen,
    activeTab: state.activeTab,
    expandedSections: state.expandedSections,
    open,
    close,
    toggle,
    setActiveTab,
    toggleSection,
    isSectionExpanded,
  };
}
