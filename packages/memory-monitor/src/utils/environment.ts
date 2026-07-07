import type { PanelMode } from "../types";

/**
 * Check if running on server (SSR)
 */
export function isSSR(): boolean {
  return typeof window === "undefined";
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  // Check for common development environment indicators
  if (typeof process !== "undefined" && process.env) {
    return process.env.NODE_ENV === "development";
  }

  // Fallback: check if running on localhost
  if (!isSSR()) {
    const hostname = window.location?.hostname;
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname?.startsWith("192.168.") ||
      hostname?.endsWith(".local")
    );
  }

  return false;
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  if (typeof process !== "undefined" && process.env) {
    return process.env.NODE_ENV === "production";
  }
  return !isDevelopment();
}

/**
 * Determine if the panel should render based on mode
 *
 * @param mode - Panel visibility mode
 * @returns Whether the panel should render
 */
export function getShouldRender(mode: PanelMode): boolean {
  switch (mode) {
    case "always":
      return true;
    case "never":
    case "headless":
      // "never" and "headless" both don't render UI
      // The difference is handled in getShouldActivate
      return false;
    case "production":
      return isProduction();
    case "development":
    default:
      return isDevelopment();
  }
}

/**
 * Determine if monitoring features should be active
 *
 * Features can be active even when panel is not rendered (headless mode).
 * - "headless": No UI but monitoring runs (for production callbacks)
 * - "never": No UI and no monitoring (completely disabled)
 *
 * @param mode - Panel visibility mode
 * @param disableInProduction - Whether to disable in production
 * @returns Whether features should be active
 */
export function getShouldActivate(
  mode: PanelMode,
  disableInProduction: boolean
): boolean {
  // Only "never" completely disables monitoring
  // "headless" keeps monitoring active without UI
  if (mode === "never") {
    return false;
  }

  // If disableInProduction is true and we're in production, don't activate
  if (disableInProduction && isProduction()) {
    return false;
  }

  return true;
}
