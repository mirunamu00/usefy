import { afterEach, vi } from "vitest";

// The engine suite (src/model, src/search) is pure — no DOM, no timers, no
// globals — while the React suite mounts into jsdom. This setup stays minimal
// and only guarantees spies and stubbed globals don't leak between tests when
// running via the package-local config; the repo-root central config uses the
// root vitest.setup.ts instead, and every test here is written to pass under
// both.
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
