import { afterEach, vi } from "vitest";

// The engine tests install their own rAF / matchMedia / ResizeObserver
// doubles per test file, so this setup stays minimal. It only guarantees
// spies don't leak between tests when running via the package-local config
// (the repo-root central config uses the root vitest.setup.ts instead —
// tests in this package are written to pass under both).
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
