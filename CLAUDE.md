# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**usefy** is a pnpm + Turbo monorepo of production-ready React hooks and standalone feature components, published to npm under the `@usefy/*` namespace. Each hook/component ships as its own independently-versioned package. Hooks additionally roll up into a single umbrella package (`@usefy/hooks`) that re-exports every hook for convenient single-import consumption. Feature components (e.g. `@usefy/memory-monitor`) are **not** bundled behind an umbrella — each is installed on its own.

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

Root `pnpm test` runs `vitest --config vitest.packages.config.ts`, a **single central config** that globs `packages/hooks/*/src/**/*.test.{ts,tsx}` and `packages/*/src/**/*.test.{ts,tsx}` (the latter covers top-level component packages like `memory-monitor`) — it does NOT go through Turbo. To scope tests:

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
├── memory-monitor/             # @usefy/memory-monitor — standalone component (not a hook, no umbrella)
└── <package>/                  # future top-level packages sit here too — another umbrella, or another standalone package
apps/
├── storybook/                  # @usefy/storybook — interactive docs (:6006)
└── playground/                 # @usefy/playground — Vite sandbox app
```

The **top level of `packages/`** is a flat set of independent packages, one directory each — that layout **is** the classification, not any imposed category. `hooks/` happens to be an umbrella that bundles a whole family (`@usefy/hooks` + `use-*`); `memory-monitor/` is a single standalone package. Future additions — another umbrella, or another standalone UI package — sit at this same level as their own directory. The `pnpm-workspace.yaml` glob `packages/*` picks them up automatically — drop a new directory in and it's a workspace, no config edit needed.

Note the naming split: the **hook** package `@usefy/use-memory-monitor` (`packages/hooks/use-memory-monitor`) vs. the **component** package `@usefy/memory-monitor` (`packages/memory-monitor`), which consumes the hook.

### The @usefy/hooks umbrella — keep in sync

`@usefy/hooks` is the one aggregator package (component packages have none). When you add a new **hook** package you MUST wire it in two places or it won't ship in the umbrella:
1. Add the `@usefy/use-<name>: "workspace:*"` dependency in `packages/hooks/package.json`.
2. Add the `export { ... } from "@usefy/use-<name>"` block in `packages/hooks/src/index.ts` (re-export the hook **and all its public types/helpers** — see existing entries for the full-surface pattern).

(The `pnpm-workspace.yaml` glob `packages/hooks/*` already covers a new hook directory.) Standalone component packages need no umbrella wiring — they are published and consumed on their own.

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

## Mandatory review loop (STANDARD PROCESS — do not skip)

Any time source code is added or changed under `packages/**` or `apps/**` (a new hook/component package, or a modification to an existing one), the change is **not done** until it has passed review. This applies whether the work was done directly or delegated to the **`usefy-package-dev`** agent.

The orchestrating (main) agent MUST run this loop:

1. **Build the change** — directly or via the `usefy-package-dev` agent (which drives the `add-usefy-*` skills).
2. **Review** — invoke the **`usefy-reviewer`** agent on the diff. It reports findings only; it never edits code. Give it the changed files and design intent.
3. **Triage & fix** — address every confirmed correctness/completeness finding (fix code, tests, docs, umbrella wiring, changeset). Consciously decide and state which findings are declined and why.
4. **Re-verify** — re-run `pnpm typecheck` + the package's tests (and re-review if the fixes were substantial) until green.
5. **Only then** report the change as complete / ready for commit / PR.

`usefy-package-dev` builds; `usefy-reviewer` reviews; the main agent owns the loop between them. Do not report a package "shipped" or "green" until step 2–4 have actually run.

## Opening a PR (STANDARD PROCESS — do not skip)

When the user says "let's PR" / "PR 하자" (or similar), "doing the PR" means exactly three steps — **commit, push, then hand back a prefilled PR link. Do NOT create the PR yourself** (no `gh pr create`, no API call). The user reviews and submits it.

1. Commit the change on the feature branch (feature work and unrelated process/docs changes in separate commits).
2. `git push -u origin <branch>`.
3. Build and hand back a **prefilled GitHub compare link** for the user to click:
   `https://github.com/<owner>/<repo>/compare/master...<branch>?expand=1&title=<url-encoded title>&body=<url-encoded body>`
   Encode with `[uri]::EscapeDataString(...)` in PowerShell. The body MUST follow the repo's PR template `.github/PULL_REQUEST_TEMPLATE.md` verbatim — same sections in the same order (Summary → Type of change → Changes → Checklist → Notes), with the checkboxes filled in. Do not invent your own sections.

## Release Process (Changesets)

1. Make changes on a feature branch.
2. `pnpm changeset` → select affected packages + bump type. **No changeset = not released.**
3. Commit the changeset with your code; open a PR to `master` (see "Opening a PR" above — hand back the link, don't create it).
4. On merge, the `Release` GitHub Action (`.github/workflows/release.yml`) opens a "Version Packages" PR.
5. Merging that PR runs `pnpm release` (`pnpm build && changeset publish`) to publish to npm.

## Pre-commit Hooks (Husky + lint-staged)

`lint-staged.config.js` runs on staged files:
- `packages/**/*.{ts,tsx,js,jsx}` → `vitest related --run --config vitest.packages.config.ts <files>`
- `packages/**/*.{ts,tsx}` → `turbo run typecheck`
