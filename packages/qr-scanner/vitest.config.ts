import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    // The decoder oracle sweeps 160 version × level combinations through a full
    // encode → rasterize → decode round trip; the default 5s timeout is not
    // enough for the widest of them on a cold cache.
    testTimeout: 30_000,
  },
});
