---
name: add-usefy-hook
description: Complete end-to-end workflow for adding a new React hook package to the usefy monorepo — scaffolding, multi-file implementation, tests, wiring the @usefy/hooks umbrella, build/test/typecheck verification, a Storybook story, coverage badges, the three READMEs, and a changeset. Use this skill whenever the user wants to add, create, scaffold, or implement a new @usefy hook (e.g. "add a useX hook", "create a new hook package", "implement useKeyPress", "let's build the next hook from the ROADMAP", "add a hook to usefy"), even if they only mention the hook logic and not the packaging/docs. It exists so a new hook ships complete — package + tests + story + docs + release — instead of just a source file.
---

# Add a usefy hook

This skill captures the full, repeatable process for shipping a new hook in this monorepo. The goal is a **complete** package — not just an implementation file, but tests, umbrella wiring, an interactive story, coverage, three updated READMEs, and a changeset — because a hook that isn't wired into the umbrella, documented, and given a changeset simply doesn't reach users.

Work through the phases in order. Verify at each checkpoint rather than at the very end; a mistake in the umbrella wiring or a config typo is far cheaper to catch early.

## Monorepo facts you need

- Package manager is **pnpm** (workspace protocol). Never use npm/yarn to install.
- Hooks live at `packages/hooks/use-<name>/`. The umbrella package `@usefy/hooks` (at `packages/hooks/`) re-exports every hook.
- All `@usefy/*` packages are a **fixed** changeset group (`.changeset/config.json` → `"fixed": [["@usefy/*"]]`), so any release bumps them all together to the same version.
- Tests run from a **central** config at the repo root (`vitest.packages.config.ts`), not per-package Turbo. Each package still has its own `vitest.config.ts` for `pnpm --filter` runs.
- Naming: directory `use-key-press` → package `@usefy/use-key-press` → hook `useKeyPress`. Kebab dir, camelCase hook, PascalCase types.

## Phase 1 — Scaffold the package

Create `packages/hooks/use-<name>/` with these files. **Clone them from the most similar existing hook** (a rich one like `use-hover` is a good multi-file template) and change only `name`, `description`, `keywords`, and `repository.directory`. The config files are otherwise identical across hooks. See `references/templates.md` for the exact contents.

```
packages/hooks/use-<name>/
├── package.json          # @usefy/use-<name>, version matches the current group version
├── tsconfig.json         # extends ../../../tsconfig.json
├── tsup.config.ts        # cjs+esm, dts, external react/react-dom
├── vitest.config.ts      # jsdom, globals, ./vitest.setup.ts
├── vitest.setup.ts       # jest-dom matchers + cleanup
└── src/
    ├── index.ts          # re-exports the hook + public types + public helpers
    ├── types.ts          # options/return/other exported types (if the surface is non-trivial)
    ├── utils.ts          # pure helpers (parsing, SSR guards, etc.) — testable in isolation
    ├── use<Name>.ts      # the hook implementation
    └── use<Name>.test.ts # tests
```

For a tiny hook you can keep everything in `use<Name>.ts`; split into `types.ts`/`utils.ts` once there are real types or pure helpers worth unit-testing on their own.

## Phase 2 — Implement the hook

Follow the house conventions (they're what make these hooks feel consistent and production-ready):

- Export the **hook function plus its return/option type interfaces** (e.g. `useToggle` + `UseToggleReturn`), and any pure helpers the hook exposes. Consumers rely on these types.
- Wrap every returned function in `useCallback` for stable references.
- **SSR-safe**: guard `window`/`document` access (`typeof window !== "undefined"`) and return a sensible inert value on the server.
- **Handler-ref pattern**: for hooks that attach event listeners with user callbacks, store the latest callback/options in a `useRef` updated each render, and have stable listeners read from the ref. This avoids re-registering listeners when only a callback changes. See `use-event-listener` and `use-hover` for the canonical shape.
- Comprehensive JSDoc with a runnable `@example` on the exported hook.
- Support React 18 and 19 (`peerDependencies: "react": "^18.0.0 || ^19.0.0"`).

**Return shape convention**: match the ecosystem idiom for the specific hook, not a blanket rule. State-tracking hooks that expose several controls return an object (+ optional `Symbol.iterator` for tuple destructuring, like `use-hover`). A single-value detector returns the bare value (e.g. `useKeyPress` returns a `boolean`). Put everything else in an options object rather than growing the return.

## Phase 3 — Write tests (target 90%+ coverage)

Co-locate `use<Name>.test.ts` in `src/`. Use `@testing-library/react`'s `renderHook`/`act` and Vitest. Cover: initialization/defaults, every option, the happy path, edge cases, `enabled`/disable toggling, cleanup on unmount, and SSR/unsupported environments. Unit-test the pure helpers in `utils.ts` directly — they're the cheapest coverage and the easiest to reason about.

**Coerce DOM values you return or branch on to strict types.** A real bug from `useKeyPress`: an `isEditableElement` helper returned `element.isContentEditable`, which is `undefined` in jsdom, violating its `: boolean` contract and failing a test. Fix at the source (`=== true`), not by loosening the test. This applies to any DOM property that may be absent in the test environment.

## Phase 4 — Wire the umbrella (3 places — miss one and it won't ship)

1. `packages/hooks/package.json` → add `"@usefy/use-<name>": "workspace:*"` to `dependencies`.
2. `packages/hooks/src/index.ts` → add an `export { ... } from "@usefy/use-<name>"` block. **Re-export the public surface only** — the hook, its public types, and genuinely useful helpers. Do NOT leak internal, generically-named utilities (e.g. `createMatcher`, `resolveTarget`) into the umbrella; they cause future name collisions. Keep those available from the individual package instead.
3. Run `pnpm install` to link the new workspace dependency.

## Phase 5 — Verify

```bash
pnpm --filter @usefy/use-<name> build
pnpm --filter @usefy/use-<name> typecheck
pnpm --filter @usefy/use-<name> test
```

Then confirm the umbrella and the rest of the repo still build with the new export:

```bash
pnpm build        # turbo builds the whole graph incl. @usefy/hooks
pnpm typecheck
pnpm test         # full suite from the central config
```

If the umbrella `build`/`typecheck` errors with "Cannot find module '@usefy/use-...'" for *sibling* packages, that just means the siblings aren't built yet — run `pnpm build` (turbo respects the dep graph) rather than chasing a phantom error.

## Phase 6 — Storybook

Add `apps/storybook/src/stories/use<Name>.stories.tsx` following an existing story (`useHover.stories.tsx` is a good template): import from `@usefy/use-<name>`, use the shared `storyTheme` for styling, and write a handful of scenarios with `play` tests (`within`/`userEvent`/`expect` from `@storybook/test`). Give interactive elements `data-testid`s.

Then:
1. Add `"@usefy/use-<name>": "workspace:*"` to `apps/storybook/package.json` dependencies and run `pnpm install`.
2. Verify it compiles: `pnpm --filter @usefy/storybook build-storybook` (a TS/compile error fails the build).

## Phase 7 — Coverage

```bash
pnpm test:coverage
```

Note the new package's **statement** coverage %. Confirm the HTML report exists at `coverage/use-<name>/src/index.html` (the READMEs link to it). This is regenerated on deploy, but generating it locally validates the link and gives you the badge number.

## Phase 8 — READMEs (three files)

1. **New** `packages/hooks/use-<name>/README.md` — clone `use-hover/README.md` and rewrite: overview, install, quick start, full API reference (options table), examples, behavior notes, Storybook + coverage links, test count.
2. **Root** `README.md` — add the hook to the "Highlights" list and to the `Packages → Hooks` table.
3. **Umbrella** `packages/hooks/README.md` — add a row to the "Available Hooks" table **with a coverage badge** (`![NN%](https://img.shields.io/badge/coverage-NN%25-brightgreen?style=flat-square)` using the Phase 7 number), add the hook to the Quick Start import list, and add a `<details>` block under the appropriate Features section.

## Phase 9 — Changeset

```bash
pnpm changeset   # select the new package + @usefy/hooks, choose the bump
```

Or write `.changeset/<name>.md` by hand with frontmatter listing `"@usefy/use-<name>"` and `"@usefy/hooks"` and the bump type (new feature = `minor`; docs-only follow-ups = `patch`). Because of the fixed group, the whole `@usefy/*` set bumps together — that's expected. Verify with `pnpm changeset status`. **Without a changeset, nothing publishes.**

## Release & publishing notes (context, not usually your job)

Merging to `master` creates a "Version Packages" PR; merging *that* publishes to npm. Two npm gotchas that have bitten this repo — surface them if a release fails:
- **Silent 404 on publish** → the npm token expired. Regenerate it.
- **403 "granular access token with bypass 2fa enabled is required"** → the granular token was created without the **"Bypass 2FA"** option (off by default since npm's Dec 2025 secure-by-default change). Recreate the token with that box checked. Account-level 2FA state is irrelevant.

## Definition of done

Implementation + tests (90%+) green · umbrella wired in all 3 places · `pnpm build && pnpm test && pnpm typecheck` clean · Storybook story compiles · coverage badge added · three READMEs updated · changeset present and `pnpm changeset status` shows the expected bump.
