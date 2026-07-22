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
- The **hook family** (`@usefy/hooks` umbrella + every `@usefy/use-*`) is a **fixed** changeset group (`.changeset/config.json` → `"fixed": [["@usefy/hooks", "@usefy/use-*"]]`), so any hook release bumps the whole family together to the same version. Standalone component packages are NOT in the group — they version independently.
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

### Collection / data-structure hook recipe

Hooks that wrap a mutable collection (`useMap`, `useSet`, and future `useArray`/`useQueue`/`useStack`/`useObject`) share one proven shape — reuse it verbatim, it's what makes them enterprise-grade:

- **Return `[value, actions]`** (tuple), with the value typed **read-only** (`ReadonlyMap`/`ReadonlySet`/`readonly T[]`). The read-only type is the point: it makes `value.set(...)`/`value.push(...)` a compile error, steering callers to the actions instead of silently breaking React state.
- **Immutable updates**: every mutating action does `setState(prev => { const next = new Map(prev); …; return next; })`. Never mutate `prev`.
- **No-op skipping**: if an update wouldn't change anything (removing an absent key, clearing an empty collection, setting a key to the value it already holds by `Object.is`), `return prev` so React bails out of the re-render. Test this (see Phase 3).
- **Stable actions**: wrap each action in `useCallback([])` (functional `setState` means no deps) and bundle them in a `useMemo` object. The actions object then keeps a stable identity forever, so it's safe as a `useEffect` dependency.
- **Lazy init**: accept `Collection | Iterable<…> | (() => Collection | Iterable<…>)`. Resolve once into a `useRef` (so `reset` can restore a *fresh copy* of the original), and seed `useState` from a copy of it. Never mutate the caller's passed-in collection.
- **Stable readers**: expose `has`/`get` as `useCallback([])` that read from a ref mirroring the latest state (`const ref = useRef(value); ref.current = value;`), so they're both stable and always current.
- **Scope discipline**: add genuinely useful extras (`useSet`'s `toggle(value, force?)`, `useMap`'s `get`) but *decline* ones that hurt type safety — e.g. a functional updater on `set(key, value)` is ambiguous when `V` is itself a function, so leave it out and say why.

`useMap` (`packages/hooks/use-map`) and `useSet` (`packages/hooks/use-set`) are the reference implementations — copy their structure.

## Phase 3 — Write tests (target 90%+ coverage)

Co-locate `use<Name>.test.ts` in `src/`. Use `@testing-library/react`'s `renderHook`/`act` and Vitest. Cover: initialization/defaults, every option, the happy path, edge cases, `enabled`/disable toggling, cleanup on unmount, and SSR/unsupported environments. Unit-test the pure helpers in `utils.ts` directly — they're the cheapest coverage and the easiest to reason about.

**Coerce DOM values you return or branch on to strict types.** A real bug from `useKeyPress`: an `isEditableElement` helper returned `element.isContentEditable`, which is `undefined` in jsdom, violating its `: boolean` contract and failing a test. Fix at the source (`=== true`), not by loosening the test. This applies to any DOM property that may be absent in the test environment.

**Assert reference stability / no-op skipping.** For collection and state hooks, capture the value before an update and assert identity: `const before = result.current[0]; act(() => actions.remove("absent")); expect(result.current[0]).toBe(before);`. This proves no-op updates don't allocate a new collection or trigger a re-render, and that mutating actions *do* produce a new reference (`expect(after).not.toBe(before)`). Also assert the actions object and each action stay identity-stable across `rerender()` — that's the contract that lets consumers use them as effect deps.

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

1. **New** `packages/hooks/use-<name>/README.md` — follow the standardized
   template in `references/readme-template.md` (do NOT free-hand it; that led to
   inconsistent headers and missing links). The required backbone: centered logo
   + name + tagline, the four badges, a nav row, and the **📚 View Storybook
   Demo** link (path `hooks-use<hooklower>--docs`, matching the story title
   `Hooks/useX`) — this link is mandatory and was the most-missed piece — then
   Overview, Features, Installation, Quick Start, API, Testing (real coverage %
   and test count from Phase 7), and License. Rich option-driven hooks may add
   `## Examples`/`## Performance`/`## Browser Support`, but the backbone is the
   consistent minimum. When standardizing several packages, drive the template
   from a small data-per-hook node script rather than editing each file by hand.
2. **Root** `README.md` — add the hook to the "Highlights" list and to the `Packages → Hooks` table.
3. **Umbrella** `packages/hooks/README.md` — add a row to the "Available Hooks" table **with a coverage badge** (`![NN%](https://img.shields.io/badge/coverage-NN%25-brightgreen?style=flat-square)` using the Phase 7 number), add the hook to the Quick Start import list, and add a `<details>` block under the appropriate Features section.

## Phase 9 — Changeset

```bash
pnpm changeset   # select the new package + @usefy/hooks, choose the bump
```

Or write `.changeset/<name>.md` by hand with frontmatter listing `"@usefy/use-<name>"` and `"@usefy/hooks"` and the bump type (new feature = `minor`; docs-only follow-ups = `patch`). Because of the fixed group, the whole hook family (`@usefy/hooks` + every `@usefy/use-*`) bumps together — that's expected; standalone components are unaffected. Verify with `pnpm changeset status`. **Without a changeset, nothing publishes.**

## Phase 10 — Generate a prefilled PR link (at task completion)

When the branch's work is complete and green (a single hook, or the last hook
in a batch), **produce a ready-to-open GitHub PR link with the title and
description already filled in** — so the user only clicks it and presses
"Create pull request", no copy-paste.

Build a **compare URL** with URL-encoded `title` and `body` query params:

```
https://github.com/mirunamu00/usefy/compare/master...<branch>?expand=1&title=<enc>&body=<enc>
```

- `master` is the base (default) branch; `<branch>` is the current feature branch.
- A `body` query param **overrides** the static `.github/PULL_REQUEST_TEMPLATE.md`, so encode a fully-written body (follow the template's sections: Summary / Type of change / Changes / Checklist / Notes; list every affected `@usefy/*` package and tick the checklist).

**Generate it with a node script file, never `node -e` inline** — the `&` in the URL and in text like "SSR & lifecycle" is interpreted by the shell (Git Bash) and corrupts inline eval. Write a `.mjs` to the scratchpad and run it:

```js
import { readFileSync, writeFileSync } from "fs";
const body = readFileSync(process.argv[2], "utf8");        // pre-written PR body .md
const title = "feat: <concise title>";
const url =
  "https://github.com/mirunamu00/usefy/compare/master...<branch>?expand=1" +
  "&title=" + encodeURIComponent(title) +
  "&body="  + encodeURIComponent(body);
writeFileSync(process.argv[3], url);
console.log("len", url.length);   // keep under ~8000 (GitHub URL limit)
```

Then present the URL to the user as a single clickable markdown link. If `gh`
is installed and authenticated, `gh pr create --title ... --body-file ...` is an
alternative, but the prefilled link needs no auth and is the default.

Commit-message note: this repo's Bash tool is Git Bash (POSIX sh), not
PowerShell — do **not** use `@'...'@` heredocs for `git commit -m` (they inject
a literal `@`). Use `git commit -F <file>` with a message file, or `-m` with a
plain single-line string.

## Release & publishing notes (context, not usually your job)

Merging to `master` creates a "Version Packages" PR; merging *that* publishes to npm. Two npm gotchas that have bitten this repo — surface them if a release fails:
- **Silent 404 on publish** → the npm token expired. Regenerate it.
- **403 "granular access token with bypass 2fa enabled is required"** → the granular token was created without the **"Bypass 2FA"** option (off by default since npm's Dec 2025 secure-by-default change). Recreate the token with that box checked. Account-level 2FA state is irrelevant.

## Definition of done

Implementation + tests (90%+) green · umbrella wired in all 3 places · `pnpm build && pnpm test && pnpm typecheck` clean · Storybook story compiles · coverage badge added · three READMEs updated · changeset present and `pnpm changeset status` shows the expected bump · **a prefilled PR link generated and handed to the user (Phase 10)**.
