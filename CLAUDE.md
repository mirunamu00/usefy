# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**usefy** is a pnpm + Turbo monorepo of production-ready React hooks and feature kits, published to npm under the `@usefy/*` namespace. Each hook/component ships as its own independently-versioned package, and two umbrella packages (`@usefy/hooks`, `@usefy/kits`) re-export everything for convenient single-import consumption.

## Common Commands

```bash
pnpm install            # Install deps (MUST use pnpm — workspace protocol)
pnpm build              # Build all packages (turbo, respects dep graph)
pnpm test               # Run ALL package tests (central vitest config)
pnpm test:coverage      # Tests with v8 coverage
pnpm test:ui            # Vitest UI
pnpm typecheck          # tsc --noEmit across all packages (turbo)
pnpm dev                # Watch-build all packages (turbo, persistent)
pnpm storybook          # Storybook on :6006 (apps/storybook)
pnpm changeset          # Create a changeset (required for release)
pnpm clean              # Remove dist + node_modules
```

### Running a subset of tests

Root `pnpm test` runs `vitest --config vitest.packages.config.ts`, a **single central config** that globs `packages/hooks/*/src/**/*.test.{ts,tsx}` and `packages/components/*/src/**` — it does NOT go through Turbo. To scope tests:

```bash
# Single file / directory (from repo root, using the central config)
pnpm vitest --config vitest.packages.config.ts run packages/hooks/use-toggle

# A single package via its own vitest.config.ts
pnpm --filter @usefy/use-toggle test
pnpm --filter @usefy/use-toggle test:watch

# Filter by test name
pnpm vitest --config vitest.packages.config.ts run -t "toggles value"
```

Each package also exposes `build`, `test`, `test:watch`, `typecheck`, and `clean` scripts individually — target them with `pnpm --filter <pkg-name> <script>`.

## Architecture

### Monorepo layout (workspaces defined in `pnpm-workspace.yaml`)

```
packages/
├── hooks/
│   ├── src/index.ts            # @usefy/hooks umbrella — re-exports every hook package
│   ├── package.json            # depends on all @usefy/use-* via workspace:*
│   └── use-<name>/             # individual @usefy/use-<name> packages (the real hooks)
├── kits/
│   ├── src/index.ts            # @usefy/kits umbrella — re-exports component kits
│   └── memory-monitor/         # published as @usefy/memory-monitor (a React component, not a hook)
apps/
├── storybook/                  # @usefy/storybook — interactive docs (:6006)
└── playground/                 # @usefy/playground — Vite sandbox app
```

Note the naming split: the **hook** package `@usefy/use-memory-monitor` (`packages/hooks/use-memory-monitor`) vs. the **component** package `@usefy/memory-monitor` (`packages/kits/memory-monitor`), which consumes the hook.

### Umbrella packages — keep in sync

`@usefy/hooks` and `@usefy/kits` are aggregators. When you add a new hook/component package you MUST wire it in three places or it won't ship in the umbrella:
1. Add the `@usefy/use-<name>: "workspace:*"` dependency in `packages/hooks/package.json`.
2. Add the `export { ... } from "@usefy/use-<name>"` block in `packages/hooks/src/index.ts` (re-export the hook **and all its public types/helpers** — see existing entries for the full-surface pattern).
3. Add the package under the correct `pnpm-workspace.yaml` glob (already covered by `packages/hooks/*`).

### Individual hook package structure

```
packages/hooks/use-<name>/
├── src/
│   ├── index.ts          # export { useX, type UseXReturn } from "./useX"
│   ├── use<Name>.ts      # implementation, JSDoc + exported types
│   └── use<Name>.test.ts # tests (co-located)
├── tsup.config.ts        # entry src/index.ts, format cjs+esm, dts, external react/react-dom
├── vitest.config.ts      # jsdom env
├── tsconfig.json
└── package.json
```

### Build & tooling
- **tsup** bundles each package to CJS + ESM + `.d.ts` (`dist/`), with `react`/`react-dom` marked external.
- **Turbo** (`turbo.json`) orchestrates `build`/`typecheck`/`test` with `dependsOn: ["^build"]`, so dependents rebuild after their deps.
- **Vitest** runs in a jsdom environment with `globals: true` and a shared setup file.

### Hook authoring conventions

> Adding a whole new hook? Use the **`add-usefy-hook`** skill — it walks the full workflow (scaffold → implement → test → umbrella wiring → Storybook → coverage → 3 READMEs → changeset).

1. Export the hook function plus its return-type interface (e.g. `useToggle` + `UseToggleReturn`), and any pure helpers the hook exposes.
2. Wrap every returned function in `useCallback` for stable references.
3. Comprehensive JSDoc with a runnable `@example`.
4. Support React 18 and 19 (`peerDependencies: react ^18 || ^19`).
5. Aim for 90%+ test coverage.

## Release Process (Changesets)

1. Make changes on a feature branch.
2. `pnpm changeset` → select affected packages + bump type. **No changeset = not released.**
3. Commit the changeset with your code; open a PR to `master`.
4. On merge, the `Release` GitHub Action (`.github/workflows/release.yml`) opens a "Version Packages" PR.
5. Merging that PR runs `pnpm release` (`pnpm build && changeset publish`) to publish to npm.

## Pre-commit Hooks (Husky + lint-staged)

`lint-staged.config.js` runs on staged files:
- `packages/**/*.{ts,tsx,js,jsx}` → `vitest related --run --config vitest.packages.config.ts <files>`
- `packages/**/*.{ts,tsx}` → `turbo run typecheck`
