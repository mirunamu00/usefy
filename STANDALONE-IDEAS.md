# Standalone component ideas

A browsable, non-committal shortlist of standalone components worth building for
usefy. This is a **reference to pick from**, not a roadmap — nothing here is
scheduled, ordered, or promised. Add, cull, and re-rank freely.

For the *committed* process of actually building one, see the
`add-usefy-component` skill and CLAUDE.md.

## What makes a good usefy standalone

The bar these candidates are judged against — a strong pick hits most of these:

1. **Real engineering depth.** Something with a hand-written core worth
   unit-testing (an algorithm, a physics/geometry/parsing engine, tricky
   interaction state) — not a 50-line wrapper. "만들 맛" matters.
2. **Reuses the hook family.** The more `@usefy/use-*` hooks it composes
   (focus-trap, controllable-state, hotkeys, scroll-lock, positioning, …), the
   better it showcases the ecosystem and the less it re-bugs solved problems.
3. **Zero-dep, headless-first.** Ships a framework-free `./headless` core plus
   the styled React layer; no heavy runtime deps (bundle a highlighter/parser →
   seam it out, don't include it).
4. **Browser-QA-able quality.** Its correctness is something you can *see* — ink
   feel, motion sync, layout, a11y — so the house browser-QA pipeline can prove
   it (CLAUDE.md "Quality bar").
5. **A genuine gap — verified, not assumed.** Before committing, check npm
   publish dates + weekly downloads of the incumbents. The diff-viewer lesson:
   we assumed a stalled niche and found the community fork was actively
   maintained and *more* used. Compete on quality; never ship an unverified
   "abandoned" claim.

**Already shipped (don't dupe):** memory-monitor, network-indicator,
scroll-progress, virtual-keyboard, spotlight-tour, confetti, signature-pad,
diff-viewer.

---

## Input & form

Extends the `virtual-keyboard` / `signature-pad` line. Heavy hook reuse
(`use-controllable-state`, `use-hotkeys`, `use-focus-within`, `use-merged-refs`).

| Idea | What it is | Depth & fit | Likely hook reuse |
|---|---|---|---|
| **otp-input** | One-time-code / PIN entry field | Paste distribution across cells, IME/composition, `autocomplete="one-time-code"` autofill, focus stepping, backspace/arrow edge cases — a deep bag of interaction bugs to get right | controllable-state, merged-refs, key-press |
| **color-picker** | HS/RGB/hex picker | The 2026 angle: modern color spaces (OKLCH/P3), gamut mapping, `EyeDropper` API — react-colorful is small/solid but sRGB-only. Pretty, tactile demo | controllable-state, long-press, event-listener |
| **tag-input / combobox** | Token/chips input with autocomplete | List filtering, keyboard nav, create-on-enter, dedupe, async options; the WAI-ARIA combobox pattern done right | controllable-state, hotkeys, on-click-outside, focus-within |
| **file-dropzone** | Drag-and-drop upload zone | DataTransfer parsing, folder traversal, type/size validation, paste-to-upload, preview thumbnails, a11y — no deps (react-dropzone is the incumbent; verify its state) | event-listener, controllable-state |
| **slider / range** | Single & dual-thumb range | Pointer + keyboard + touch, ticks/marks, RTL, step snapping, collision between thumbs — small surface, deep interaction | controllable-state, long-press, measure |
| **rating** | Star / heart rating | Half-steps, hover-preview vs committed, keyboard, RTL — small but a clean showcase | controllable-state, hotkeys |

## Data & text

Extends `diff-viewer` (the new data/text line). Strong "pure engine +
hand-testable" fit.

| Idea | What it is | Depth & fit | Likely hook reuse |
|---|---|---|---|
| **json-viewer / tree-view** | Collapsible JSON / tree explorer | Virtualized tree, lazy expansion, search + path highlight, copy-path, big-payload guard — reuses diff-viewer's virtualization + guard know-how | resize-observer, intersection-observer |
| **code-block** | Copy-able code with line numbers | The `renderContent` highlighter-seam pattern (proven in diff-viewer): line numbers, highlight ranges, copy button, wrap toggle — zero-dep, seam the highlighter | copy-to-clipboard |
| **qr-code** | QR generator (SVG + canvas) | A genuinely pure algorithm (Reed–Solomon ECC, mask selection) — 100%-testable, zero-dep, tiny bundle, crisp demo, exportable like signature-pad | — (pure) |
| **table-of-contents** | Auto TOC from headings + scroll-spy | Heading extraction, active-section tracking, smooth scroll, nested rendering — the classic docs-site widget done accessibly | intersection-observer, scroll-position |
| **markdown / prose viewer** | Render markdown with a parser seam | Bring-your-own-parser (like the highlighter seam); focus on safe rendering, heading anchors, TOC integration — careful scope so it doesn't bloat | — |

## Overlay & feedback

Extends `spotlight-tour` (in-house positioning engine) + `confetti`. Heavy a11y
hook reuse.

| Idea | What it is | Depth & fit | Likely hook reuse |
|---|---|---|---|
| **toast / notifications** | Queued toast system | Queue + priority, positions, swipe-to-dismiss, pause-on-hover, `aria-live` regions, timers, reduced-motion — genuinely fiddly to do accessibly | timeout, hotkeys, reduced-motion, long-press |
| **popover / tooltip** | Floating positioning primitive | Reuse spotlight-tour's flip/shift/arrow engine as a general (but scoped) floating layer — collision, portals, focus, dismiss. A foundational piece others build on | focus-trap, on-click-outside, resize-observer |
| **context-menu** | Right-click / long-press menu | Pointer positioning, submenus, keyboard roving, viewport collision, touch long-press — pairs with the positioning engine | long-press, hotkeys, focus-trap, on-click-outside |
| **modal / dialog** | Accessible dialog + drawer | Focus trap, scroll lock, `inert`, stacking, `Esc`, animation — the composition showcase (nearly all a11y hooks at once); Radix is strong here, so verify the angle | focus-trap, scroll-lock, hotkeys, disclosure |
| **command-palette** | ⌘K palette | Fuzzy scoring, virtualized results, nested pages, keyboard nav — high demand, but **cmdk is a strong incumbent**: only build with a real differentiator | hotkeys, focus-trap, controllable-state |

## Media & canvas

Extends `confetti` / `signature-pad` (canvas/DPR/engine know-how).

| Idea | What it is | Depth & fit | Likely hook reuse |
|---|---|---|---|
| **image-cropper** | Crop / zoom / rotate → canvas output | Pointer + wheel + pinch gestures, aspect locks, output at DPR, rotation math — react-easy-crop is solid, so verify the angle (headless? modern gestures?) | measure, resize-observer, long-press |
| **image-compare** | Before/after slider | Pointer/keyboard/touch divider, lazy images, labels — small, high visual impact, great card demo | measure, controllable-state |
| **sparkline** | Tiny inline SVG chart | Pure path math, min/max markers, responsive, tooltip-on-hover — zero-dep, pairs with memory-monitor's dashboard vibe | measure, resize-observer |
| **avatar** | Image → initials/gradient fallback | Load/error states, deterministic color from a seed, status ring, grouping/stacking — small, ubiquitous | — |

## Motion & delight

Extends the motion-quality lessons (confetti retune, tooltip sync). Browser-QA
is the whole point.

| Idea | What it is | Depth & fit | Likely hook reuse |
|---|---|---|---|
| **number-ticker** | Animated number/odometer transitions | Digit-roll animation, `Intl` formatting across transitions, reduced-motion, spring vs duration — NumberFlow exists, so verify the angle | reduced-motion, raf-state, interval |
| **typewriter** | Typing / deleting text animation | Multi-string cycling, variable speed, cursor, reduced-motion static fallback — landing-page staple, small | interval, reduced-motion |
| **marquee** | Seamless infinite scroller | True seamless loop (measure + duplicate), pause-on-hover, gradient masks, reduced-motion, RTL — trickier than it looks to make gapless | measure, resize-observer, reduced-motion |
| **skeleton** | Loading-placeholder shimmer | Auto-shape from content, shimmer vs pulse, reduced-motion, a11y `aria-busy` — tiny but everywhere | reduced-motion |

## Utility widgets

Extends `memory-monitor` / `network-indicator` / `scroll-progress` (dev/status
widgets). Lower depth — good for a quick, high-utility win.

| Idea | What it is | Depth & fit | Likely hook reuse |
|---|---|---|---|
| **fps-meter** | Frame-rate overlay | The literal sibling of memory-monitor — rAF sampling, min/avg/p95, sparkline. Near-clone of an existing pipeline | raf-state, interval |
| **back-to-top** | Scroll-to-top button | Appears past a threshold, smooth scroll, reduced-motion, progress ring variant — small, universal | scroll-position, reduced-motion |
| **cookie-consent** | Consent banner + preferences | Category toggles, persistence, a11y, callback API — dull but genuinely in demand for EU sites | local-storage, focus-trap |
| **keyboard-shortcuts-help** | `?` overlay listing shortcuts | Pairs with `use-hotkeys` — auto-collects registered shortcuts, grouped, searchable modal | hotkeys, focus-trap, scroll-lock |

---

## Shortlist (strongest picks right now)

Purely a starting point for the next pick — reorder to taste:

1. **otp-input** — deep interaction edge cases, ubiquitous form need, high hook reuse; the natural next input component.
2. **qr-code** — a genuinely pure algorithm (great house-test fit), zero-dep, exportable, crisp demo; broadens the data line without a UI-heavy surface.
3. **popover / tooltip** — promote spotlight-tour's positioning engine into a foundational floating primitive others reuse; high leverage.
4. **toast / notifications** — the accessible-queue problem is deceptively deep and a strong composition/a11y showcase.
5. **image-compare** — small, high visual impact, excellent landing-card demo; low risk.

**Before committing to any of these:** run the §"genuine gap" check —
npm publish dates + weekly downloads of the incumbents — and decide whether the
angle is a real gap or a quality play. Then write the SPEC and go through the
phased build + review loop like the shipped eight.
