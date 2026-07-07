import React from "react";
import { clsx } from "clsx";
import type { PanelTab } from "../../types";
import { PANEL_TABS } from "../../constants";
import styles from "./PanelTabs.module.scss";

export interface PanelTabsProps {
  /** Currently active tab */
  activeTab: PanelTab;
  /** Tab change handler */
  onTabChange: (tab: PanelTab) => void;
  /** Whether auto-snapshot is currently active */
  isAutoSnapshotActive?: boolean;
  /** Custom class name */
  className?: string;
}

/**
 * Icon components for each tab
 */
const TabIcons: Record<string, React.FC<{ className?: string }>> = {
  chart: ({ className }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3 3v18h18" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </svg>
  ),
  clock: ({ className }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  camera: ({ className }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  ),
  cog: ({ className }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
};

/**
 * Tab navigation component for the panel
 */
export function PanelTabs({
  activeTab,
  onTabChange,
  isAutoSnapshotActive = false,
  className,
}: PanelTabsProps) {
  return (
    <div className={clsx(styles.tabs, className)} role="tablist">
      {PANEL_TABS.map((tab) => {
        const Icon = TabIcons[tab.icon];
        const isActive = activeTab === tab.id;
        const showPulseDot = tab.id === "snapshots" && isAutoSnapshotActive;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            onClick={() => onTabChange(tab.id as PanelTab)}
            className={clsx(styles.tab, isActive && styles.active)}
          >
            {Icon && <Icon className={styles.tabIcon} />}
            <span className={styles.tabLabel}>{tab.label}</span>

            {/* Pulse dot for active auto-snapshot */}
            {showPulseDot && (
              <span className={styles.pulseDot}>
                <span className={styles.pingAnimation} />
                <span className={styles.dotInner} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

PanelTabs.displayName = "PanelTabs";
