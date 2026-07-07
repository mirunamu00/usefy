import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

expect.extend(matchers);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock performance.memory for tests
export function createMockPerformanceMemory(
  options: {
    usedJSHeapSize?: number;
    totalJSHeapSize?: number;
    jsHeapSizeLimit?: number;
  } = {}
) {
  return {
    usedJSHeapSize: options.usedJSHeapSize ?? 50 * 1024 * 1024,
    totalJSHeapSize: options.totalJSHeapSize ?? 100 * 1024 * 1024,
    jsHeapSizeLimit: options.jsHeapSizeLimit ?? 2 * 1024 * 1024 * 1024,
  };
}

export function mockSupportedBrowser(
  memoryOptions?: Parameters<typeof createMockPerformanceMemory>[0]
) {
  const mockMemory = createMockPerformanceMemory(memoryOptions);
  Object.defineProperty(performance, "memory", {
    value: mockMemory,
    writable: true,
    configurable: true,
  });
  return mockMemory;
}

export function mockUnsupportedBrowser() {
  Object.defineProperty(performance, "memory", {
    value: undefined,
    writable: true,
    configurable: true,
  });
}

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Mock matchMedia for theme detection
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver (required for recharts ResponsiveContainer)
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, "ResizeObserver", {
  writable: true,
  value: ResizeObserverMock,
});

// Mock requestAnimationFrame (used by recharts)
Object.defineProperty(window, "requestAnimationFrame", {
  writable: true,
  value: (callback: FrameRequestCallback) => setTimeout(callback, 0),
});

Object.defineProperty(window, "cancelAnimationFrame", {
  writable: true,
  value: (id: number) => clearTimeout(id),
});

// Setup supported browser by default
mockSupportedBrowser();
