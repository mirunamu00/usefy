import { afterEach, vi } from "vitest";

// The Phase 1 suite is pure (no DOM, no timers, no globals), so this setup
// stays minimal. It only guarantees spies don't leak between tests when
// running via the package-local config — the repo-root central config uses
// the root vitest.setup.ts instead, and every test in this package is
// written to pass under both.
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
