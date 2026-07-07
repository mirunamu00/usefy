---
name: add-usefy-kit
description: Packaging, umbrella-wiring, docs, and release workflow for shipping a new feature-kit (React component) package to the usefy monorepo under packages/kits/. Use this skill whenever the user wants to add, scaffold, wire up, document, or release a new @usefy kit / feature-kit / UI component package (e.g. "add a kit", "create a feature kit", "scaffold @usefy/confetti", "let's build the confetti kit", "ship the next kit", "wire the memory-monitor kit into the umbrella"). This is the KIT counterpart to add-usefy-hook — reach for it for component packages under packages/kits/, NOT for hook packages under packages/hooks/ (those use add-usefy-hook). It deliberately does NOT hand you the component implementation — a kit's UI/logic is bespoke and driven by that kit's own SPEC.md; the skill covers everything AROUND the implementation so the kit ships complete instead of stranded.
---

# Add a usefy kit

This skill captures the repeatable process for shipping a **feature kit** — a
published React component package under `packages/kits/`, like
`@usefy/memory-monitor`. A kit that isn't wired into the `@usefy/kits` umbrella,
documented, and given a changeset simply doesn't reach users.

## Scope: this skill is deliberately lean

Unlike hooks, **kit implementations are NOT templatable** — each kit is a bespoke
component (or component library) and no two share a structure. So this skill does
**not** scaffold or write the component for you. Instead:

- **The kit's `SPEC.md` (and optionally `SPEC_KO.md`) is the source of truth for
  the implementation.** Write/read the SPEC first, build the component against it
  in the normal conversation, then use this skill for everything around it.
- This skill owns the **repeatable ritual**: package config, the `@usefy/kits`
  umbrella wiring, Storybook, the READMEs, verification, the changeset, and the
  prefilled PR link.

`@usefy/memory-monitor` (`packages/kits/memory-monitor`) is the **canonical live
kit** — clone its config files, don't free-hand them.

## Kit vs hook — the naming split (read this first)

usefy has a deliberate split (see CLAUDE.md):

- A **hook** package `@usefy/use-<name>` lives at `packages/hooks/use-<name>/` and is built with the **`add-usefy-hook`** skill.
- A **kit** package `@usefy/<name>` (NO `use-` prefix) lives at `packages/kits/<name>/` and is built with **this** skill.
- A kit is usually the **UI layer built on top of a hook**: `@usefy/memory-monitor` (component) depends on `@usefy/use-memory-monitor` (hook) via `workspace:*`.

So a full "MemoryMonitor-style" feature often means **two** packages: build the hook with `add-usefy-hook` first, then the kit with this skill. Confirm with the user whether the hook already exists or needs building.

Naming: directory `confetti` → package `@usefy/confetti` → component `Confetti` (PascalCase) + `ConfettiProps` type.

## Monorepo facts you need

- Package manager is **pnpm** (workspace protocol). Never npm/yarn.
- The umbrella package `@usefy/kits` (at `packages/kits/`) re-exports every kit. Individual kits live at `packages/kits/<name>/`.
- `pnpm-workspace.yaml` already globs `packages/kits` and `packages/kits/*` — **no workspace edit needed** for a new kit dir.
- All `@usefy/*` packages are a **fixed** changeset group (`.changeset/config.json` → `"fixed": [["@usefy/*"]]`) — any release bumps them all to the same version. A new kit's `version` should match the current group version.
- **Kit tests do NOT run under the repo-root central config.** `vitest.packages.config.ts` globs only `packages/hooks/*` and `packages/components/*` — **not `packages/kits/*`**. So `pnpm test` at the root won't pick up a kit's tests; run them per-package with `pnpm --filter @usefy/<name> test` (memory-monitor works this way). Clone `memory-monitor`'s `vitest.config.ts` + `vitest.setup.ts` for the kit, and note that the pre-commit `vitest related` hook likewise won't cover kit files.

## Phase 1 — SPEC first (the implementation contract)

Before any packaging, make sure a `packages/kits/<name>/SPEC.md` exists and is
agreed. `memory-monitor/SPEC.md` and the unbuilt `confetti/SPEC.md` are the
model — a SPEC describes the component's API (props, types, behavior, theming,
accessibility) so the implementation is a translation, not an invention. If the
kit has an existing hook counterpart, the SPEC references it.

Then **build the component in the normal conversation against the SPEC** — this
skill resumes at Phase 2 once the implementation exists.

## Phase 2 — Package config (clone from memory-monitor, adapt)

Create `packages/kits/<name>/package.json` by cloning `memory-monitor`'s and
changing `name` (`@usefy/<name>`, no `use-` prefix), `version` (current group
version), `description`, `keywords`, `repository.directory`, `homepage`, and the
`dependencies` (its hook counterpart + any runtime deps like `clsx`).

Kit `package.json` differs from a hook's in ways that matter:

- **`@usefy/<name>`** — no `use-` prefix.
- **Real runtime `dependencies`** are normal (e.g. `clsx`, the paired `@usefy/use-<name>` hook). Extra **peerDependencies** for heavy viz libs (memory-monitor peers `recharts`) so the consumer owns the version.
- **If the kit ships CSS**: add a `"./styles.css": "./dist/styles.css"` entry to `exports`, and set `"sideEffects": ["*.css"]` (NOT `false` — CSS has side effects). A CSS-less kit keeps `"sideEffects": false`.
- Scripts mirror memory-monitor: `build`/`dev`/`test`/`test:watch`/`typecheck`/`clean` (+ any kit-specific ones).

**`tsup.config.ts` — two paths, pick by whether the kit has styles:**

- **Ships SCSS/CSS modules** → clone `packages/kits/memory-monitor/tsup.config.ts` verbatim. It's a substantial bespoke config: an esbuild `scss-modules` plugin (SCSS → scoped CSS with `:global()` preservation), a `dist/styles.css` bundle written in `onSuccess`, runtime CSS injection appended to both JS bundles, a `"use client";` banner, and `external: ["react","react-dom", <viz libs>]`. Add each heavy peer dep to `external`.
- **Pure JS, no styles** → the minimal config is enough (clone `packages/kits/tsup.config.ts`, the umbrella's): `entry src/index.ts`, `format cjs+esm`, `dts`, `external: ["react","react-dom"]`.

Also clone `tsconfig.json`, and — if the kit has tests — `vitest.config.ts` + `vitest.setup.ts` from memory-monitor.

## Phase 3 — Wire the @usefy/kits umbrella (2 edits + install)

Analogous to the hooks umbrella. Miss one and the kit won't ship in `@usefy/kits`:

1. `packages/kits/package.json` → add `"@usefy/<name>": "workspace:*"` to `dependencies`.
2. `packages/kits/src/index.ts` → add a `export { Component, type ComponentProps, ...all public types } from "@usefy/<name>";` block. Follow the existing memory-monitor block (it re-exports the component, a back-compat alias, the headless hook, and every public type). **Re-export the public surface only** — don't leak internal utilities.
3. Run `pnpm install` to link the new workspace dependency.

**CSS note:** the umbrella (`packages/kits/tsup.config.ts`) only externalizes react — it doesn't re-bundle a kit's `styles.css`. That's fine because memory-monitor's build **injects its CSS at runtime** on import, so `import { MemoryMonitor } from "@usefy/kits"` still gets styled. If a new kit ships CSS via the `./styles.css` export **without** runtime injection, document that consumers of the umbrella must also import the stylesheet.

## Phase 4 — Verify

```bash
pnpm --filter @usefy/<name> build
pnpm --filter @usefy/<name> typecheck
pnpm --filter @usefy/<name> test        # if the kit has tests
```

Then confirm the umbrella and the whole graph still build with the new export:

```bash
pnpm build        # turbo builds the whole graph incl. @usefy/kits
pnpm typecheck
pnpm test         # full suite
```

If the umbrella `build`/`typecheck` errors with "Cannot find module '@usefy/...'" for sibling packages, they just aren't built yet — run `pnpm build` (turbo respects the dep graph) rather than chasing a phantom error.

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

1. **New** `packages/kits/<name>/README.md` — model it on `packages/kits/memory-monitor/README.md` (centered logo + name + tagline, npm/downloads/bundle-size badges, Overview, Features, Installation — including the `./styles.css` import if the kit needs it, Quick Start, API/Props table, and License).
2. **Root** `README.md` — three touch points: the **"Available Kits"** list (~line 147), the **"Choose Your Package"** table's single-kit row (~line 162), and the **`### Kits (\`@usefy/kits\`)`** table (~line 293).
3. **Umbrella** `packages/kits/README.md` — add the kit to its listing/quick-start.

## Phase 7 — Changeset

```bash
pnpm changeset   # select @usefy/<name> + @usefy/kits, choose the bump
```

New kit = `minor`; docs-only follow-ups = `patch`. Because of the fixed group the
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

Component implemented against its SPEC · package config cloned + adapted (CSS
`exports`/`sideEffects` correct if it ships styles) · `@usefy/kits` umbrella wired
in both places · `pnpm build && pnpm test && pnpm typecheck` clean · Storybook
story compiles · README (new kit) + root README (3 spots) + umbrella README
updated · changeset present and `pnpm changeset status` shows the expected bump ·
**a prefilled PR link generated and handed to the user**.
