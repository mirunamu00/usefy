import { useEffect, useRef, useCallback } from "react";
import { AUTO_GC_COOLDOWN_MS } from "../constants";
import type { AutoGCEventData } from "../types";

/**
 * Options for useAutoGC hook
 */
export interface UseAutoGCOptions {
  /** Whether auto-GC is enabled */
  enabled: boolean;
  /** Usage threshold to trigger GC (0-100) */
  threshold: number | null;
  /** Current usage percentage */
  usagePercentage: number | null;
  /** Function to request GC */
  requestGC: () => void;
  /** Callback when auto-GC is triggered */
  onAutoGC?: (data: AutoGCEventData) => void;
  /** Cooldown period in milliseconds */
  cooldownMs?: number;
}

/**
 * Return type for useAutoGC hook
 */
export interface UseAutoGCReturn {
  /** Timestamp of last GC trigger */
  lastTriggered: number | null;
  /** Whether GC is currently on cooldown */
  isOnCooldown: boolean;
  /** Manually trigger GC (bypasses cooldown) */
  forceGC: () => void;
}

/**
 * Hook to automatically trigger garbage collection when memory threshold is exceeded
 *
 * @param options - Configuration options
 * @returns GC state and control functions
 *
 * @example
 * ```tsx
 * const { lastTriggered, isOnCooldown } = useAutoGC({
 *   enabled: true,
 *   threshold: 85,
 *   usagePercentage: currentUsage,
 *   requestGC: () => monitor.requestGC(),
 *   onAutoGC: (data) => console.log('Auto-GC triggered', data),
 * });
 * ```
 */
export function useAutoGC(options: UseAutoGCOptions): UseAutoGCReturn {
  const {
    enabled,
    threshold,
    usagePercentage,
    requestGC,
    onAutoGC,
    cooldownMs = AUTO_GC_COOLDOWN_MS,
  } = options;

  const lastTriggeredRef = useRef<number | null>(null);
  const onAutoGCRef = useRef(onAutoGC);

  // Update callback ref
  useEffect(() => {
    onAutoGCRef.current = onAutoGC;
  }, [onAutoGC]);

  // Check if on cooldown
  const isOnCooldown =
    lastTriggeredRef.current !== null &&
    Date.now() - lastTriggeredRef.current < cooldownMs;

  // Auto-GC effect
  useEffect(() => {
    // Skip if disabled or no threshold set
    if (!enabled || threshold === null || usagePercentage === null) {
      return;
    }

    // Skip if usage is below threshold
    if (usagePercentage < threshold) {
      return;
    }

    // Skip if on cooldown
    const now = Date.now();
    if (
      lastTriggeredRef.current !== null &&
      now - lastTriggeredRef.current < cooldownMs
    ) {
      return;
    }

    // Trigger GC
    lastTriggeredRef.current = now;
    requestGC();

    // Call callback
    onAutoGCRef.current?.({
      threshold,
      usage: usagePercentage,
      timestamp: now,
    });
  }, [enabled, threshold, usagePercentage, requestGC, cooldownMs]);

  // Force GC function (bypasses cooldown)
  const forceGC = useCallback(() => {
    const now = Date.now();
    lastTriggeredRef.current = now;
    requestGC();

    if (threshold !== null && usagePercentage !== null) {
      onAutoGCRef.current?.({
        threshold,
        usage: usagePercentage,
        timestamp: now,
      });
    }
  }, [requestGC, threshold, usagePercentage]);

  return {
    lastTriggered: lastTriggeredRef.current,
    isOnCooldown,
    forceGC,
  };
}
