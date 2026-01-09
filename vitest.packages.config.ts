import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: [
      "packages/hooks/*/src/**/*.test.{ts,tsx}",
      "packages/components/*/src/**/*.test.{ts,tsx}",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: [
        "packages/hooks/*/src/**/*.ts",
        "packages/components/*/src/**/*.ts",
      ],
      exclude: ["**/*.test.ts", "**/*.test.tsx", "**/index.ts"],
    },
  },
});
