import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

expect.extend(matchers);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

/**
 * Creates a mock performance.memory object for testing
 */
export function createMockPerformanceMemory(options: {
  usedJSHeapSize?: number;
  totalJSHeapSize?: number;
  jsHeapSizeLimit?: number;
} = {}) {
  return {
    usedJSHeapSize: options.usedJSHeapSize ?? 50 * 1024 * 1024, // 50MB
    totalJSHeapSize: options.totalJSHeapSize ?? 100 * 1024 * 1024, // 100MB
    jsHeapSizeLimit: options.jsHeapSizeLimit ?? 2 * 1024 * 1024 * 1024, // 2GB
  };
}

/**
 * Mocks a browser that supports performance.memory API (Chrome/Edge)
 */
export function mockSupportedBrowser(memoryOptions?: Parameters<typeof createMockPerformanceMemory>[0]) {
  const mockMemory = createMockPerformanceMemory(memoryOptions);

  Object.defineProperty(performance, "memory", {
    value: mockMemory,
    writable: true,
    configurable: true,
  });

  return mockMemory;
}

/**
 * Mocks a browser that does NOT support performance.memory API (Firefox/Safari)
 */
export function mockUnsupportedBrowser() {
  Object.defineProperty(performance, "memory", {
    value: undefined,
    writable: true,
    configurable: true,
  });
}

/**
 * Mocks the measureUserAgentSpecificMemory API (Chrome 89+)
 */
export function mockMeasureUserAgentSpecificMemory(result?: { bytes: number; breakdown: unknown[] }) {
  (performance as unknown as { measureUserAgentSpecificMemory: () => Promise<unknown> }).measureUserAgentSpecificMemory = vi.fn().mockResolvedValue(
    result ?? { bytes: 60 * 1024 * 1024, breakdown: [] }
  );
}

/**
 * Mocks window.isSecureContext
 */
export function mockSecureContext(isSecure: boolean) {
  Object.defineProperty(window, "isSecureContext", {
    value: isSecure,
    writable: true,
    configurable: true,
  });
}

/**
 * Mocks window.crossOriginIsolated
 */
export function mockCrossOriginIsolated(isIsolated: boolean) {
  Object.defineProperty(window, "crossOriginIsolated", {
    value: isIsolated,
    writable: true,
    configurable: true,
  });
}

/**
 * Resets all performance mocks to undefined state
 */
export function resetPerformanceMocks() {
  Object.defineProperty(performance, "memory", {
    value: undefined,
    writable: true,
    configurable: true,
  });

  if ("measureUserAgentSpecificMemory" in performance) {
    delete (performance as unknown as Record<string, unknown>).measureUserAgentSpecificMemory;
  }
}
