import { defineConfig } from "vitest/config";
import { storybookTest } from "@storybook/experimental-addon-test/vitest-plugin";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react(),
    storybookTest({
      configDir: ".storybook",
    }),
  ],
  test: {
    name: "storybook",
    browser: {
      enabled: true,
      headless: true,
      provider: "playwright",
      instances: [
        {
          browser: "chromium",
          context: {
            permissions: ["clipboard-read", "clipboard-write"],
          },
        },
      ],
    } as any,
    setupFiles: [".storybook/vitest.setup.ts"],
    include: ["src/**/*.stories.tsx"],
  },
});
