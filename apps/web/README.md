# @usefy/web — the usefy landing & docs site

> **Handoff document.** This file is the single source of truth for the usefy
> introduction site. Read it top-to-bottom and you can continue the work in a
> fresh session with zero prior context. It records **what was built, how, why,
> what's verified, and what's left.**

> **STATUS (current): built, reviewed, and DEPLOYED.** Live on Vercel with Git
> integration — every push to `master` auto-deploys production. The temp URL is
> `noindex` + login-protected on purpose. **The only work left is the one-time
> domain launch** (attach domain → set `NEXT_PUBLIC_SITE_URL` → remove
> `NEXT_PUBLIC_NOINDEX` → submit sitemap to Google Search Console). See §6.

---

## v2 (2026-07-23): TanStack-style org repositioning

The landing was rebuilt to present usefy as **an org shipping many tools**, not a
hooks list. Key additions (everything below is browser-verified, light+dark,
mobile, reduced-motion, via Playwright against the production build):

- **Self-demonstrating site** — every gimmick IS a usefy product: a real
  `@usefy/scroll-progress` bar tops the page (`components/page-progress.tsx`),
  "Tour this page" runs a real `@usefy/spotlight-tour` over the landing sections
  (`site-tour.tsx` shell + lazy `site-tour-impl.tsx`), copying an install
  command fires `@usefy/confetti` (`install-command.tsx`, engine imported on
  interaction).
- **Hero product switcher** (`components/hero/`) — 4 tabs (use-toggle /
  confetti / spotlight-tour / virtual-keyboard); code "types itself"
  (use-interval) then crossfades to server-highlighted Shiki HTML; a live demo
  strip under each pane (real PIN pad in lazy `keyboard-strip.tsx`). All four
  sources render invisibly stacked so the pane holds the tallest tab's height.
- **Product cards** (`components/product/product-card.tsx` + `.pcard` CSS in
  `globals.css`) — hover = per-product micro-demo (confetti burst, sparkline
  draw, mini keys typing "usefy", network pulse, spotlight sweep, bar fill,
  hook-name roll). Touch devices play the demo in-view instead.
- **Data**: `src/data/products.ts` — hand-tended product identity (accent hue
  var, role label, demo id) layered over the generated registry. Adding a
  standalone package → add an entry here + an accent token pair in
  `globals.css`, or it falls back to brand accent / no demo.
- **Product pages**: standalone `[slug]` pages get their accent + a "Live demo"
  section (`components/product-demos/*`, each a lazy `ssr:false` chunk).
- **Motion utils** (`components/motion/`): `Reveal`, `CountUp`, `WireDivider` —
  all driven by `use-intersection-observer`; reveal CSS is gated on `html.js`
  (stamped in the layout pre-paint script) so no-JS/crawlers see everything.
- **Logo** is now inline SVG (`brand-mark.tsx`) with a hover swing.

**v2 gotchas (each cost a debugging round — don't regress):**

1. **Never compose callback refs inline** (`ref={(n) => {a(n); b(n);}}`) — new
   identity every render → observer detach/attach loop → React #185. Use
   `@usefy/use-merged-refs` (see `product-card.tsx`).
2. A `pointer-events: none` element never receives pointer events — the hero
   spotlight listens on `el.closest("section")` (`hero-backdrop.tsx`).
3. `CountUp` must **server-render the real value** (crawlers must never see
   "0 hooks"); it resets to 0 pre-paint via `useLayoutEffect` only when JS runs
   and motion is allowed.
4. Themed embeds (SpotlightTour, VirtualKeyboard) can't use their own
   `theme="system"` — the site's theme is a `data-theme` attribute, so they
   track it via `lib/use-site-theme.ts` (MutationObserver +
   `useSyncExternalStore`).
5. README subtitles are HTML-entity-decoded in `scripts/build-registry.mjs`
   (`decodeEntities`) — `&amp;` was rendering literally.
6. Keep heavy demos out of first-load JS: SpotlightTour, confetti, and
   VirtualKeyboard all load on demand (landing first-load is ~117 kB).

---

## 1. What this is

A **Next.js (App Router) marketing + docs site** that introduces every published
`@usefy/*` package. It is the SEO-first, human-facing front door — distinct from
Storybook (interactive prop playground) and the per-package READMEs (exhaustive
npm reference).

**Two hard requirements from the brief, both met:**

1. **Beautiful & trustworthy design** — a developer would not bounce.
2. **SEO-optimized** — users find packages via search engines.

**The three-surface model** (the key content decision — avoids duplication):

| Surface | Role | Nature |
| --- | --- | --- |
| **Storybook** (existing) | change props, test behavior live | interactive playground |
| **README** (existing, on npm) | every example, prop, edge case | deep reference |
| **This site** (new) | install + quick start + core API in one screen, then link out | scannable entry point |

→ The site's per-package doc shows **only** the curated essentials (install →
quick start → API), then links to the README (full) and Storybook (play). It
never dumps the whole README.

---

## 2. The package layer model (important — drove the IA)

`packages/*` is a **flat set of same-layer, independent packages**. Each top-level
entry is either:

- an **umbrella / family** — `hooks` = `@usefy/hooks` + 70 `use-*` packages
  (a collection you browse into), or
- a **standalone package** — `@usefy/memory-monitor`, `@usefy/virtual-keyboard`
  (single rich packages).

`memory-monitor` / `virtual-keyboard` sit at the **same layer as `hooks`**, not
under it. Future umbrellas or standalones join this same layer. The site's
navigation reflects exactly this: the ecosystem section presents the hooks
umbrella and each standalone as peer cards.

---

## 3. Architecture

### 3a. Data layer — the backbone (auto-seeded, do not hand-write docs)

The site renders **72 packages** from a generated registry. Docs content is
**extracted**, not hand-authored, so it can never drift from the packages.

```
scripts/build-registry.mjs   ← generator (Node ESM). Runs on prebuild/predev.
  ├─ walks packages/hooks/use-* + packages/{memory-monitor,virtual-keyboard}
  ├─ reads each package.json (name, description, keywords, version)
  ├─ extracts from each README:  Quick Start code block  +  API section markdown
  ├─ applies the curated CATEGORY slug→category map (the ONE hand-tended map)
  └─ writes → src/data/registry.generated.ts   (AUTO-GENERATED, never edit)

src/data/types.ts        ← PackageEntry / CategoryId / CategoryMeta types
src/data/registry.ts     ← typed loader + category taxonomy (CATEGORIES) + helpers:
                            packages, liteList(), getPackage(), packagesByCategory(),
                            ecosystem(), categoryMeta(), packageCount/hookCount/…
```

**Category taxonomy** (8 buckets): `state`, `lifecycle`, `async`, `events`,
`layout`, `sensors`, `storage`, `component`. Every package is mapped; a missing
map entry falls back to `misc` and the generator **warns loudly** (currently 0).

### 3b. Pages (all static / SSG — 152 prerendered routes)

```
src/app/
  layout.tsx                       ← fonts, metadata base, pre-paint theme script, header/footer
  page.tsx                         ← "/"  landing (hero + ecosystem + featured + why + CTA) + WebSite JSON-LD
  not-found.tsx                    ← 404
  sitemap.ts / robots.ts           ← generated from the registry
  opengraph-image.tsx              ← root social card (next/og)
  packages/
    page.tsx                       ← "/packages"  static; renders the client explorer
    [slug]/page.tsx                ← "/packages/[slug]"  SSG per package (the core doc)
    [slug]/opengraph-image.tsx     ← per-package social card (next/og), SSG
  globals.css                      ← Tailwind v4 + design tokens + prose/code styles
```

The per-package doc (`[slug]/page.tsx`) layout: breadcrumb → title + category →
tagline → action links (npm / source / README / Storybook) → **Install** (tabbed)
→ **Quick start** (shiki) → **API reference** (markdown tables) → at-a-glance
sidebar → "Go deeper" callout → related packages. Emits `SoftwareSourceCode` +
`BreadcrumbList` JSON-LD.

### 3c. Components

```
src/components/
  site-header.tsx / site-footer.tsx / brand-mark.tsx   ← chrome ({} brace motif)
  primitives.tsx        ← Container, Eyebrow (code-comment style), Pill
  code-block.tsx        ← server; shiki-highlighted "editor pane" + copy
  markdown.tsx          ← server; react-markdown + remark-gfm for API sections
  package-card.tsx      ← a package tile (used in grids)
  package-explorer.tsx  ← CLIENT; search + family tabs + category chips over liteList()
  install-command.tsx   ← CLIENT; npm/pnpm/yarn/bun tabs + copy (dogfoods use-copy-to-clipboard)
  theme-toggle.tsx      ← CLIENT; dogfoods use-dark-mode (writes data-theme on <html>)
  copy-button.tsx       ← CLIENT; dogfoods use-copy-to-clipboard
  live-toggle-demo.tsx  ← CLIENT; hero live island, dogfoods use-toggle
src/lib/
  highlight.ts          ← shiki singleton (github-dark-default), build-time highlight
  site.ts               ← central site config (name, url, repo, storybook, npmOrg)
  cn.ts                 ← tiny classname join
```

### 3d. Dogfooding (a deliberate trust signal)

The site is built **with** usefy hooks, proving they work under Next.js/SSR:

- **theme toggle** → `@usefy/use-dark-mode` (attribute `data-theme`, storageKey `usefy-dark-mode`)
- **copy buttons / install** → `@usefy/use-copy-to-clipboard`
- **hero live demo** → `@usefy/use-toggle`

These are `workspace:*` deps in `package.json`. A pre-paint inline script in
`layout.tsx` mirrors `use-dark-mode` to set `data-theme` before first paint
(no theme flash).

### 3e. Design system

Concept: **"the hook is the hero"** — code is the product's material.

- **Type**: Space Grotesk (display) · Inter (body) · JetBrains Mono (code/data), all self-hosted via `next/font/google` (CLS 0).
- **Color**: near-monochrome ink with a single chromatic accent = **the brand itself**. The usefy logo is a fish-hook in an **indigo→violet gradient** (`#5b68db` → `#8437c6`, sampled from `assets/logo.png`). Tokens: `--brand` `#6a41d6` light / `#9d8bff` dark, plus `--brand-from`/`--brand-to` for the gradient (`.brand-gradient` utility). This replaced an earlier off-brand flat blue (`#0969DA`) to match the favicon/Storybook. Full light + dark via CSS variables (`:root`, `:root[data-theme="dark"]`, `prefers-color-scheme` fallback).
- **Brand mark**: the **real usefy hook logo** (gradient circle + white fish-hook) is used everywhere — favicon (tab), header wordmark (`brand-mark.tsx` renders `/public/hook-mark.png`), and both OG images (embedded as a base64 data URI so satori can render it). An earlier `{}` brace placeholder was replaced with the actual logo so all surfaces match. Assets: `public/hook-mark.png` (64², header), `src/app/{favicon.ico, icon.png (256²), apple-icon.png (180²)}` — all generated from `assets/favicon.png` via sharp.
- **Signature**: code-comment eyebrows (`// browse all 72`) + a real running hook in the hero + the brand-gradient primary CTAs.
- Verified in light, dark, and mobile (390px).

---

## 4. How to run

```bash
# from repo root — deps are installed via pnpm workspace
pnpm install

# dev (predev regenerates the registry). Serves on :3100
pnpm --filter @usefy/web dev

# production build (prebuild regenerates the registry) + start
pnpm --filter @usefy/web build
pnpm --filter @usefy/web start          # :3100

# regenerate the registry only (after adding/editing a package README)
pnpm --filter @usefy/web build:registry

# typecheck
pnpm --filter @usefy/web typecheck
```

### Screenshot check (used during design review)

Playwright lives in `apps/storybook/node_modules`. A throwaway script placed in
that dir (so `import { chromium } from "playwright"` resolves) against
`http://localhost:3100`, with `colorScheme` light/dark + a mobile viewport, was
used to self-critique the design. Repeat that pattern to re-verify visuals.

---

## 5. How to extend

- **A new package ships** → nothing to hand-write. Run `build:registry` (or just
  `dev`/`build`, which run it automatically). It picks up any new
  `packages/hooks/use-*` or top-level standalone with a `package.json` + README.
  **BUT**: add its slug to the `CATEGORY` map in `scripts/build-registry.mjs`, or
  it lands in `misc` (the generator prints a warning naming the slug).
- **Feature it on the landing page** → add its slug to `FEATURED` in `src/app/page.tsx`.
- **Retune categories** → edit `CATEGORY` (generator) + `CATEGORIES` (registry.ts).
- **README parsing** relies on `## Quick Start` and `## API` / `## API Reference`
  headings + the punchy `<strong>` subtitle after the `<h1>`. All 72 current
  READMEs follow this; a new one must too, or those sections come back empty
  (the generator warns which packages are missing them).

---

## 6. Status

### Done & verified

- [x] Registry extractor + taxonomy (72 packages, 0 `misc`, 0 missing sections)
- [x] Landing page (hero w/ live hook, ecosystem = same-layer model, featured, why, CTA)
- [x] `/packages` explorer (search + family + category, stays statically rendered)
- [x] `/packages/[slug]` per-package doc (SSG, install/quickstart/API/links/related + JSON-LD)
- [x] SEO: per-page `generateMetadata`, JSON-LD (WebSite/SoftwareSourceCode/BreadcrumbList), `sitemap.xml`, `robots.txt`, root + per-package OG images (next/og), self-hosted fonts, `not-found`
- [x] Dogfooding (use-dark-mode / use-copy-to-clipboard / use-toggle)
- [x] Design verified light / dark / mobile
- [x] `pnpm typecheck` clean · `next build` green (152 static pages)
- [x] Mandatory review loop (`usefy-reviewer`) run + findings triaged

### Review outcome (usefy-reviewer)

**Fixed:** theme-toggle `aria-label` hydration mismatch (was the one confirmed
bug) · removed unused `@usefy/use-counter` dep · dynamic search placeholder
count · `transpilePackages` consistency (added `use-toggle`).

**Consciously deferred:**
- The family/install tab markup uses `role="tab"` without
  `role="tabpanel"`/`aria-controls`; a `role="group"` + `aria-pressed` pattern
  would be cleaner if revisited (cosmetic a11y).
- `NEXT_PUBLIC_SITE_URL` correctness — a **deploy-time env**, tracked below.

**Post-review bug fix:** the package explorer's family filter is now **URL-driven**
via `useSearchParams()` (client), wrapped in `<Suspense>` so `/packages` stays
static. Previously it read `?family=` once in a mount effect, which went stale on
**same-route** navigations (e.g. `/packages?family=hooks` → `?family=standalone`
via the header nav didn't update the tab). Tab clicks now also write the param
(`router.replace`), so state is shareable and header nav + tabs always agree.

### Deployment — DONE ✅ (auto-deploys; live at usefy-web.vercel.app)

**Live on Vercel via Git integration.** Every push to **`master` → production
build + deploy**; other branches get Preview deploys. A **README-only change on
`master` redeploys and updates the docs** (the build's `prebuild` re-runs the
generator, which re-reads every package README) — no web source change needed.
Fail-safe: a change that breaks the build fails the deploy and the last good
version stays live.

- **Project**: `usefy-web` — id `prj_1R0HN6wxeax6StrZ3dp9kP9OSC7k`, scope
  `mirunamus-projects` (`team_osCH6hJIGBjmZF94XILZnXfV`).
- **Root Directory** = `apps/web` (set via the Vercel API; must stay this, or the
  build fails with "No Next.js version detected").
- **Build**: `apps/web/vercel.json` →
  `cd ../.. && pnpm turbo run build --filter=@usefy/web...` (builds workspace
  deps first — `dist` is gitignored, so the cloud build must build them).
- **Production URL** (canonical): `https://usefy-web.vercel.app`. We are **not**
  buying a custom domain — this Vercel subdomain is the permanent public URL. If
  a real domain is ever attached, set `NEXT_PUBLIC_SITE_URL` to override.
- **Access**: the production `usefy-web.vercel.app` deploy is **public** (no Vercel
  login wall) and `robots: index, follow`. Deployment Protection, if re-enabled,
  would put a Vercel login in front of `*.vercel.app` URLs — keep it off for this
  project so the site stays public.
- **Canonical/OG/sitemap**: `src/lib/site.ts` defaults `site.url` to
  `https://usefy-web.vercel.app`, so canonical, OG, and sitemap URLs all point at
  the live site with no env var needed.
- **Indexing**: `NEXT_PUBLIC_NOINDEX` is left unset in production (site is
  indexable); set it to `1` only for throwaway preview deploys you don't want
  crawled (see `site.noindex` in `src/lib/site.ts`).

**➡ Optional follow-up (nice-to-have, not blocking):**
- Register `usefy-web.vercel.app` in **Google Search Console** and submit
  `/sitemap.xml` — not required for indexing, but it's how you monitor coverage.

- [x] Link the site from the root `README.md`.
- [x] `packages/kits/` dead-dir removed (stale build artifacts, untracked by git).
- Not needed: **no changeset** — `@usefy/web` is `private: true`, not published.

---

## 7. Gotchas (things that already bit us — save yourself the time)

- **Stale prod server = broken CSS.** `next start` keeps running across rebuilds;
  a rebuild changes the CSS hash, and the old server serves old HTML pointing at
  a CSS file that no longer exists → the page renders **completely unstyled**.
  On Windows `pkill` may not kill the node server — free the port with PowerShell
  `Get-NetTCPConnection -LocalPort 3100 -State Listen | Stop-Process` before
  restarting, and run **one** server.
- **next/og (satori)**: every `<div>` with **more than one child** must set
  `display: flex` (or `none`). Text + `{expr}` counts as two children — wrap in a
  single template literal (`{\`npm install ${name}\`}`) or add `display:flex`.
- **Next 15**: `params` and `searchParams` are **Promises** — `await` them in
  async pages / `generateMetadata` / OG routes.
- **Keeping `/packages` static**: don't read `searchParams` in the **page** (that
  opts into dynamic rendering). Instead the client explorer uses
  `useSearchParams()` (URL-driven family filter) and is wrapped in `<Suspense>`
  on the page — that keeps the route statically prerendered while staying
  reactive to same-route query changes.
- **Tailwind v4** here (the app is isolated; Storybook still uses v3). CSS-first
  config via `@theme inline` in `globals.css`, `@tailwindcss/postcss` plugin —
  no `tailwind.config.js`.
- `registry.generated.ts` is **generated** — never edit by hand; change the
  generator or the source READMEs/package.json instead.
- **No built-in i18n** — the site relies on the browser's native translation.
  Code/identifier surfaces carry `translate="no"` + `.notranslate` so auto-transl
  doesn't mangle snippets (CodeBlock, InstallCommand, the Markdown `code`/`pre`
  components, hook names, `@usefy/*` identifiers, the "usefy" wordmark). Prose
  (taglines, API descriptions, section copy) stays translatable. **When adding a
  new code/identifier element, add the same guard.** Also: custom react-markdown
  components must destructure out the `node` prop or it leaks onto the DOM.
```
