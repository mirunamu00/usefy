---
name: add-usefy-component
description: Packaging, docs, and release workflow for shipping a new standalone feature-component package to the usefy monorepo at the top level of packages/. Use this skill whenever the user wants to add, scaffold, document, or release a new @usefy standalone component / feature package (e.g. "add a component", "create a feature component", "scaffold @usefy/confetti", "let's build the confetti component", "ship the next component"). This is the component counterpart to add-usefy-hook — reach for it for standalone component packages at packages/<name>/, NOT for hook packages under packages/hooks/ (those use add-usefy-hook). It deliberately does NOT hand you the component implementation — a component's UI/logic is bespoke and driven by that package's own SPEC.md; the skill covers everything AROUND the implementation so the package ships complete instead of stranded. Note: these components are published and installed individually — there is NO umbrella package.
---

# Add a usefy standalone component

This skill captures the repeatable process for shipping a **standalone feature
component** — a published React component package at the top level of
`packages/`, like `@usefy/memory-monitor`. Unlike hooks, these components are
**not** rolled up behind any umbrella package — each is published and installed on
its own. A component that isn't documented and given a changeset simply doesn't
reach users.

## Scope: this skill is deliberately lean

Unlike hooks, **component implementations are NOT templatable** — each is a bespoke
component (or component library) and no two share a structure. So this skill does
**not** scaffold or write the component for you. Instead:

- **The package's `SPEC.md` (and optionally `SPEC_KO.md`) is the source of truth
  for the implementation.** Write/read the SPEC first, build the component against
  it in the normal conversation, then use this skill for everything around it.
- This skill owns the **repeatable ritual**: package config, Storybook, the
  READMEs, verification, the changeset, and the prefilled PR link.

`@usefy/memory-monitor` (`packages/memory-monitor`) is the **canonical live
component** — clone its config files, don't free-hand them.

## Component vs hook — the naming split (read this first)

usefy has a deliberate split (see CLAUDE.md):

- A **hook** package `@usefy/use-<name>` lives at `packages/hooks/use-<name>/` and is built with the **`add-usefy-hook`** skill; hooks roll up into the `@usefy/hooks` umbrella.
- A **standalone component** package `@usefy/<name>` (NO `use-` prefix) lives at `packages/<name>/` (a sibling of `hooks/`) and is built with **this** skill. There is **no** component umbrella — it's published and installed on its own.
- A component is usually the **UI layer built on top of a hook**: `@usefy/memory-monitor` (component) depends on `@usefy/use-memory-monitor` (hook) via `workspace:*`.

So a full "MemoryMonitor-style" feature often means **two** packages: build the hook with `add-usefy-hook` first, then the component with this skill. Confirm with the user whether the hook already exists or needs building.

Naming: directory `confetti` → package `@usefy/confetti` → component `Confetti` (PascalCase) + `ConfettiProps` type.

## Compose existing usefy hooks — don't reinvent (core principle)

A component is a **UI layer**, and this monorepo already ships 60+ production hooks
under `packages/hooks/use-*`. **Before writing any bespoke state/effect logic in a
component, check whether a `@usefy/use-*` hook already does it, and compose that hook
instead.** This is the single biggest quality lever for a component: it's the difference
between reimplementing (and re-bugging) outside-click / focus-trap / controllable-
state for the Nth time versus reusing the battle-tested, SSR-safe, StrictMode-safe
hook the repo already tests to 90%+. It also keeps components thin and consistent.

Run `ls packages/hooks | grep '^use-'` to see the current catalog. The common
component-UI concerns and their hooks:

| Component concern | Reuse this hook |
|---|---|
| Controlled **and** uncontrolled value / open state (`value`+`defaultValue`+`onChange`) | `use-controllable-state` |
| Show/hide, open/close (panels, popovers, floating, drawers) | `use-disclosure` |
| Dismiss on outside click | `use-on-click-outside` (or `use-click-any-where`) |
| Focus containment / focus state (modals, menus, panels) | `use-focus-trap`, `use-focus-within` |
| Merge a forwarded ref with an internal one | `use-merged-refs` |
| Keyboard shortcuts / single-key handling | `use-hotkeys`, `use-key-press` |
| Press-and-hold (auto-repeat, long-press context popups) | `use-long-press` |
| Theme: dark mode / system preference | `use-dark-mode`, `use-preferred-color-scheme` |
| Respect `prefers-reduced-motion` before animating | `use-reduced-motion` |
| Persist settings/state across sessions | `use-local-storage`, `use-session-storage` |
| SSR/client guard & isomorphic layout effect | `use-is-client`, `use-isomorphic-layout-effect` |
| Always-fresh callback without re-subscribing listeners | `use-event-callback`, `use-latest` |
| Attach DOM event listeners with clean teardown | `use-event-listener` |
| Measure / observe element size, window size | `use-measure`, `use-resize-observer`, `use-window-size` |
| Responsive breakpoints | `use-media-query` |
| Copy to clipboard | `use-copy-to-clipboard` |
| Timers / animation-frame state | `use-interval`, `use-timeout`, `use-raf-state` |
| Track the previous value | `use-previous` |

Rules of thumb:

1. **Reuse first.** Every generic concern above should be a composed hook, not
   inline `useEffect`. `memory-monitor` is the model — it consumes
   `@usefy/use-memory-monitor` and keeps its own local hooks only for genuinely
   component-specific glue.
2. **Each reused hook is a `workspace:*` dependency** — add it to the component's
   `package.json` (Phase 2) so it links. Import from the individual package
   (`@usefy/use-disclosure`), not the `@usefy/hooks` umbrella, to keep the
   dependency graph precise.
3. **If a needed concern has NO hook yet**, prefer **extracting it into a new
   `@usefy/use-*` hook via `add-usefy-hook`** over burying it in the component — that
   makes the logic reusable and independently tested. Only keep logic local when
   it's truly specific to this one component.
4. **Don't reach for external deps** for anything a usefy hook covers (no
   `react-use`, `usehooks-ts`, ad-hoc clipboard libs, etc.).

## Monorepo facts you need

- Package manager is **pnpm** (workspace protocol). Never npm/yarn.
- There is **no component umbrella**. Each standalone component lives at `packages/<name>/` (a sibling of `hooks/`) and is published on its own.
- `pnpm-workspace.yaml` globs `packages/*` — **no workspace edit needed** for a new top-level component dir.
- All `@usefy/*` packages are a **fixed** changeset group (`.changeset/config.json` → `"fixed": [["@usefy/*"]]`) — any release bumps them all to the same version. A new component's `version` should match the current group version.
- **Component tests DO run under the repo-root central config.** `vitest.packages.config.ts` globs `packages/hooks/*` and `packages/*` (which covers top-level component packages), so `pnpm test` at the root picks them up. You can also run them per-package with `pnpm --filter @usefy/<name> test` (memory-monitor works this way). Clone `memory-monitor`'s `vitest.config.ts` + `vitest.setup.ts` for the component.

## Phase 1 — SPEC first (the implementation contract)

Before any packaging, make sure a `packages/<name>/SPEC.md` exists and is
agreed. `memory-monitor/SPEC.md` and the unbuilt `confetti/SPEC.md` are the
model — a SPEC describes the component's API (props, types, behavior, theming,
accessibility) so the implementation is a translation, not an invention. If the
component has an existing hook counterpart, the SPEC references it.

Then **build the component in the normal conversation against the SPEC** — this
skill resumes at Phase 2 once the implementation exists. While building, apply the
**"compose existing usefy hooks"** principle above: map each generic concern in
the SPEC to an existing `@usefy/use-*` hook first, and only hand-write what's
genuinely component-specific. A good SPEC even names the hooks it will compose (the
virtual-keyboard SPEC's dependency section is a model).

## Phase 2 — Package config (clone from memory-monitor, adapt)

Create `packages/<name>/package.json` by cloning `memory-monitor`'s and
changing `name` (`@usefy/<name>`, no `use-` prefix), `version` (current group
version), `description`, `keywords`, `repository.directory`, `homepage`, and the
`dependencies` (its hook counterpart + any runtime deps like `clsx`).

A component's `package.json` differs from a hook's in ways that matter:

- **`@usefy/<name>`** — no `use-` prefix.
- **Real runtime `dependencies`** are normal (e.g. `clsx`, the paired `@usefy/use-<name>` hook). **List every `@usefy/use-*` hook the component composes here as `"workspace:*"`** (see the "Compose existing usefy hooks" principle) — a component that imports `@usefy/use-disclosure`/`use-controllable-state`/etc. must declare each one. Extra **peerDependencies** for heavy viz libs (memory-monitor peers `recharts`) so the consumer owns the version.
- **If the component ships CSS**: add a `"./styles.css": "./dist/styles.css"` entry to `exports`, and set `"sideEffects": ["*.css"]` (NOT `false` — CSS has side effects). A CSS-less component keeps `"sideEffects": false`.
- Scripts mirror memory-monitor: `build`/`dev`/`test`/`test:watch`/`typecheck`/`clean` (+ any component-specific ones).

**`tsup.config.ts` — two paths, pick by whether the component has styles:**

- **Ships SCSS/CSS modules** → clone `packages/memory-monitor/tsup.config.ts` verbatim. It's a substantial bespoke config: an esbuild `scss-modules` plugin (SCSS → scoped CSS with `:global()` preservation), a `dist/styles.css` bundle written in `onSuccess`, runtime CSS injection appended to both JS bundles, a `"use client";` banner, and `external: ["react","react-dom", <viz libs>]`. Add each heavy peer dep to `external`.
- **Pure JS, no styles** → a minimal config is enough: `entry src/index.ts`, `format cjs+esm`, `dts`, `external: ["react","react-dom"]`. (A hook package's `tsup.config.ts` under `packages/hooks/use-*/` is a good minimal reference.)

Also clone `tsconfig.json`, and — if the component has tests — `vitest.config.ts` + `vitest.setup.ts` from memory-monitor.

## Phase 3 — Install (link the workspace)

There is **no umbrella to wire** — a standalone component ships on its own. Just
make sure any `@usefy/use-*` hooks the component composes are declared as
`"workspace:*"` dependencies in its `package.json` (Phase 2), then:

```bash
pnpm install   # links the new workspace package + its workspace:* deps
```

**CSS note:** consumers `import { Component } from "@usefy/<name>"` directly. If
the component ships CSS via the `./styles.css` export **without** runtime
injection, document that consumers must also `import "@usefy/<name>/styles.css"`.
(memory-monitor injects its CSS at runtime on import, so no extra import is
needed — clone that approach when possible.)

## Phase 4 — Verify

```bash
pnpm --filter @usefy/<name> build
pnpm --filter @usefy/<name> typecheck
pnpm --filter @usefy/<name> test        # if the component has tests
```

Then confirm the whole graph still builds:

```bash
pnpm build        # turbo builds the whole graph
pnpm typecheck
pnpm test         # full suite (now includes the component's tests)
```

If `build`/`typecheck` errors with "Cannot find module '@usefy/...'" for sibling packages, they just aren't built yet — run `pnpm build` (turbo respects the dep graph) rather than chasing a phantom error.

## Phase 5 — Storybook

Add `apps/storybook/src/stories/<Component>.stories.tsx` (PascalCase file, e.g.
`MemoryMonitor.stories.tsx`) — clone the existing `MemoryMonitor.stories.tsx` as
the template. Import from `@usefy/<name>`, use the shared `storyTheme`, and write
a handful of scenarios; give interactive elements `data-testid`s and add `play`
tests where it makes sense. (The **`add-usefy-story`** skill is the authority on
story quality and the "Show code" convention — invoke it for the story itself.)

Then:
1. Add `"@usefy/<name>": "workspace:*"` (and its paired hook, if the story uses it directly) to `apps/storybook/package.json` dependencies, and run `pnpm install`.
2. Verify it compiles: `pnpm --filter @usefy/storybook build-storybook`.

## Phase 6 — READMEs

1. **New** `packages/<name>/README.md` — model it on `packages/memory-monitor/README.md` (centered logo + name + tagline, npm/downloads/bundle-size badges, Overview, Features, Installation — including the `./styles.css` import if the component needs it, Quick Start, API/Props table, and License).
2. **Root** `README.md` — the root README classifies **by actual top-level package** (no "Components"/category bucket — see CLAUDE.md). Add the new package as a **sibling of `@usefy/hooks`** in each place:
   - the **Overview** package table (`| @usefy/<name> | one-line description |`),
   - a `### @usefy/<name>` section in the **Ecosystem** list (badges + install + quick example + "View full documentation →"), modeled on the `@usefy/memory-monitor` block and placed as a peer of `### @usefy/hooks`,
   - a `### @usefy/<name>` section in the **Packages** listing (an exports/API table), a peer of `### @usefy/hooks`,
   - and a row in the **"Choose Your Package"** quick-start table, labeled by the package (e.g. `Memory monitor`), not a generic "component".

## Phase 7 — Changeset

```bash
pnpm changeset   # select @usefy/<name>, choose the bump
```

New component = `minor`; docs-only follow-ups = `patch`. Because of the fixed group the
whole `@usefy/*` set bumps together — expected. Verify with `pnpm changeset
status`. **Without a changeset, nothing publishes.**

## Phase 8 — Prefilled PR link (at completion)

Identical to the hooks workflow — **reuse `add-usefy-hook`'s Phase 10 verbatim**:
build a `https://github.com/mirunamu00/usefy/compare/master...<branch>?expand=1&title=<enc>&body=<enc>`
compare URL with URL-encoded title + a fully-written body, generated by a `.mjs`
script written to the scratchpad (never `node -e` inline — the `&` in the URL
corrupts shell eval). See `.claude/skills/add-usefy-hook/SKILL.md` Phase 10 for
the exact script and the Git Bash commit-message caveat.

## Release & publishing notes

Same pipeline and same npm gotchas as hooks (merging to `master` → "Version
Packages" PR → merge publishes). If a release fails: silent **404** = expired npm
token; **403 "granular access token with bypass 2fa enabled is required"** = the
token was made without the **"Bypass 2FA"** box. See `add-usefy-hook`'s release
notes for the full detail.

## Definition of done

Component implemented against its SPEC · **generic concerns composed from existing
`@usefy/use-*` hooks (not reinvented inline), each declared as a `workspace:*`
dependency** · package config cloned + adapted (CSS `exports`/`sideEffects`
correct if it ships styles) · lives at `packages/<name>/` (top level, no umbrella
wiring) · `pnpm build && pnpm test && pnpm typecheck` clean · Storybook
story compiles · README (new component) + root README (added as a sibling of `@usefy/hooks` — Overview table, Ecosystem, Packages) updated ·
changeset present and `pnpm changeset status` shows the expected bump ·
**a prefilled PR link generated and handed to the user**.
