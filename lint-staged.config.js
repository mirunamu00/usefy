module.exports = {
  "packages/**/*.{ts,tsx,js,jsx}": (files) =>
    `vitest related --run --config vitest.packages.config.ts ${files.join(
      " "
    )}`,
  "packages/**/*.{ts,tsx}": () => "turbo run typecheck",
  // A brief is prose, so nothing else catches a citation that stopped existing.
  ".claude/agents/*.md": () =>
    "vitest run --config vitest.packages.config.ts tools/agent-config/agent-citations.test.ts",
};
