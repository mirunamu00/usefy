import { afterEach, vi } from "vitest";

// The camera and native-engine tests install their own globals per test file
// (`navigator.mediaDevices`, `BarcodeDetector`, video/canvas doubles), so this
// setup stays minimal: it only guarantees spies and stubbed globals do not leak
// between tests when running via the package-local config. The repo-root
// central config uses the root vitest.setup.ts instead — tests in this package
// are written to pass under both.
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
