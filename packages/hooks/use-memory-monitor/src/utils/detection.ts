import type {
  BrowserSupport,
  SupportLevel,
  AvailableMetric,
  UnsupportedInfo,
  UnsupportedReason,
  FallbackStrategy,
} from "../types";

/**
 * Check if running in a server-side environment
 */
export function isServer(): boolean {
  return typeof window === "undefined";
}

/**
 * Check if running in a client-side environment
 */
export function isClient(): boolean {
  return typeof window !== "undefined";
}

/**
 * Check if the legacy performance.memory API is available (Chrome/Edge)
 */
export function hasLegacyMemoryAPI(): boolean {
  if (isServer()) return false;
  return "memory" in performance;
}

/**
 * Check if the modern measureUserAgentSpecificMemory API is available
 */
export function hasPreciseMemoryAPI(): boolean {
  if (isServer()) return false;
  return "measureUserAgentSpecificMemory" in performance;
}

/**
 * Check if running in a secure context (HTTPS or localhost)
 */
export function isSecureContext(): boolean {
  if (isServer()) return false;
  return window.isSecureContext ?? false;
}

/**
 * Check if cross-origin isolated (required for precise memory API)
 */
export function isCrossOriginIsolated(): boolean {
  if (isServer()) return false;
  return window.crossOriginIsolated ?? false;
}

/**
 * Check if MutationObserver is available for DOM tracking
 */
export function hasMutationObserver(): boolean {
  if (isServer()) return false;
  return "MutationObserver" in window;
}

/**
 * Attempt to detect the browser name
 */
export function detectBrowser(): string | undefined {
  if (isServer()) return undefined;

  const userAgent = navigator.userAgent;

  if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) {
    return "Chrome";
  }
  if (userAgent.includes("Edg")) {
    return "Edge";
  }
  if (userAgent.includes("Firefox")) {
    return "Firefox";
  }
  if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
    return "Safari";
  }

  return undefined;
}

/**
 * Determine the support level based on available APIs
 */
export function determineSupportLevel(): SupportLevel {
  if (isServer()) return "none";

  if (hasLegacyMemoryAPI()) {
    return "full";
  }

  // DOM-only tracking is always available in browser
  return "partial";
}

/**
 * Get the list of available metrics based on browser support
 */
export function getAvailableMetrics(): AvailableMetric[] {
  if (isServer()) return [];

  const metrics: AvailableMetric[] = [];

  if (hasLegacyMemoryAPI()) {
    metrics.push("heapUsed", "heapTotal", "heapLimit");
  }

  // DOM tracking is always available in browser
  metrics.push("domNodes");

  // Event listener estimation is always available
  metrics.push("eventListeners");

  return metrics;
}

/**
 * Get limitations based on current browser/context
 */
export function getLimitations(): string[] {
  const limitations: string[] = [];

  if (isServer()) {
    limitations.push("Running in server-side environment");
    return limitations;
  }

  if (!hasLegacyMemoryAPI()) {
    limitations.push("performance.memory API not available (not Chrome/Edge)");
  }

  if (!isSecureContext()) {
    limitations.push("Not running in secure context (HTTPS required for precise API)");
  }

  if (!isCrossOriginIsolated()) {
    limitations.push(
      "Not cross-origin isolated (COOP/COEP headers required for precise API)"
    );
  }

  return limitations;
}

/**
 * Comprehensive browser support detection
 */
export function detectSupport(): BrowserSupport {
  return {
    level: determineSupportLevel(),
    availableMetrics: getAvailableMetrics(),
    limitations: getLimitations(),
    isSecureContext: isSecureContext(),
    isCrossOriginIsolated: isCrossOriginIsolated(),
    hasPreciseMemoryAPI: hasPreciseMemoryAPI(),
  };
}

/**
 * Determine the reason why memory monitoring is not supported
 */
export function getUnsupportedReason(): UnsupportedReason {
  if (isServer()) {
    return "server-side";
  }

  if (!isSecureContext() && hasPreciseMemoryAPI()) {
    return "insecure-context";
  }

  if (!hasLegacyMemoryAPI() && !hasPreciseMemoryAPI()) {
    return "no-api";
  }

  return "browser-restriction";
}

/**
 * Get available fallback strategies based on support
 */
export function getAvailableFallbacks(): FallbackStrategy[] {
  if (isServer()) {
    return ["none"];
  }

  const fallbacks: FallbackStrategy[] = ["none"];

  // DOM-only is always available in browser
  fallbacks.push("dom-only");

  // Estimation can work in any browser
  fallbacks.push("estimation");

  return fallbacks;
}

/**
 * Create UnsupportedInfo object for callbacks
 */
export function createUnsupportedInfo(): UnsupportedInfo {
  return {
    reason: getUnsupportedReason(),
    browser: detectBrowser(),
    availableFallbacks: getAvailableFallbacks(),
  };
}

/**
 * Check if the precise memory API can be used
 * Requires secure context AND cross-origin isolation
 */
export function canUsePreciseMemoryAPI(): boolean {
  return hasPreciseMemoryAPI() && isSecureContext() && isCrossOriginIsolated();
}

/**
 * Check if any memory monitoring is possible
 */
export function canMonitorMemory(): boolean {
  return isClient() && (hasLegacyMemoryAPI() || hasPreciseMemoryAPI());
}
