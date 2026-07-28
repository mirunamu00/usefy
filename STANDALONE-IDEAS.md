# Standalone component ideas

A browsable, non-committal shortlist of standalone components worth building for
usefy. A **reference to pick from**, not a roadmap — with exactly one exception:
the "Next up" section directly below names the package that has been *decided*.
Everything after it is unscheduled, unordered, and unpromised as before.

For the *committed* build process, see the `add-usefy-component` skill and
CLAUDE.md.

---

## Next up — `json-viewer` (decided 2026-07-28)

**The next standalone package to build is `json-viewer`.** Not yet started; this
section is the decision and its evidence, so the build can begin from here
instead of re-litigating the pick.

### The angle, verified rather than assumed

Every incumbent renders the **whole tree**. Checked on 2026-07-28 — none of the
five depends on a virtualization library, and none so much as mentions
"virtual" or "window" in its README:

| Package | Weekly | Last publish | Runtime deps | README says "virtual"/"window" |
|---|---|---|---|---|
| `react-json-view` | 1,369,700 | **64.7 mo** | flux, react-base16-styling, … | no |
| `@microlink/react-json-view` | 585,076 | 0.0 mo | react-base16-styling, … | no |
| `react-json-view-lite` | 1,583,074 | 10.7 mo | (none) | no |
| `react-json-tree` | 1,048,102 | 16.9 mo | @types/lodash, … | no |
| `json-edit-react` | 329,809 | 1.1 mo | (none) | no |

`react-json-view-lite` does claim "large / huge / performance" — but with no
windowing behind it. That is fast *rendering*, not a bounded DOM. So the gap is
real and it is checkable: **window a tree nobody else windows.**

### Two premises this list had wrong — corrected before the SPEC

The old shortlist entry justified `json-viewer` twice, and both reasons were
wrong. Recording the corrections, because the wrong version made it look like
the cheap option and it is not.

**1. It does *not* reuse diff-viewer's windowing directly.** That engine is
fixed-height over a *static* list, and says so itself
(`packages/diff-viewer/src/components/useVirtualRows.ts`): no measurement, no
cumulative-offset cache, and `wrap` turns virtualization off entirely because
"measured virtualization is a different, much larger problem". A JSON tree
changes length on every expand and collapse. What carries over is the know-how,
not the code.

**2. `JSON.parse` being a free oracle means there is no parser to write.**
Measured on Node 22 — 40.5 MB / ~4.5 M nodes parses in **402 ms**; V8's string
cap is 512 MB. A streaming parser solves a problem that does not exist. **The
bottleneck is rendering, not parsing.**

### Where the real engine is

Three pieces, none of which usefy has written before:

1. **Lazy flattening over a subtree-size index** (an order-statistic tree). A
   4.5 M-node tree cannot be flattened into a row array — the row descriptors
   alone are the problem. Each node carries its expanded-descendant count so
   `rowAt(i)` resolves in O(depth). *Oracle: a naive flatten, on small inputs.*
2. **Scroll anchoring across expand/collapse.** The row under the cursor must
   not jump. diff-viewer never faced this — its row list is immutable.
3. **Chunked, yielding search with path highlight.** Searching 4.5 M nodes must
   not hold the main thread. *Oracle: a naive O(n) reference scan.*

All three are **measurable** (gate ④): frame time while scrolling a 40 MB
payload. That is also the storefront demo — one "load 40 MB" button, scrolled at
60 fps on input that locks the tab for every incumbent.

### Scope, settled up front (CLAUDE.md "build it properly the first time")

- **In:** the lazy-flattening engine, scroll anchoring, chunked search + path
  highlight, copy-path / copy-value, a framework-free `./headless`, big-payload
  guards.
- **Out — a separate idea, not this package's other half:** **editing**. That is
  `json-edit-react`'s territory and stands in the same relation as
  `qr-code` → `qr-scanner`: two packages, not one split in two.
- **Decided:** rows are **fixed-height with truncation**, plus a per-row "show
  full value" expansion. Wrapping long string values would make rows
  variable-height — precisely the problem diff-viewer documented and declined —
  and every incumbent truncates too. This keeps the engine sound without
  shipping an incomplete UX.

Effort is below `qr-scanner`: no ISO specification, no camera permissions, no
worker protocol. Budget the same ~⅓ for the review loop, which both `qr-code`
and `qr-scanner` found to be the real cost.

## What a usefy standalone IS (and what it is NOT)

usefy standalones are **self-contained feature libraries** — the kind of thing
someone deliberately `npm install`s *on its own* because it does one substantial
thing completely, with a real hand-written engine behind it. They map 1:1 to
well-known standalone libraries, not to design-system parts:

| Shipped | The standalone library it stands next to |
|---|---|
| `confetti` | canvas-confetti |
| `signature-pad` | signature_pad |
| `diff-viewer` | react-diff-viewer |
| `qr-code` | qrcode + qrcode.react + qr-code-styling, in one engine |
| `spotlight-tour` | react-joyride / driver.js |
| `virtual-keyboard` | react-simple-keyboard |
| `qr-scanner` | jsQR / zxing-js / @yudiel/react-qr-scanner, plus the native `BarcodeDetector` |
| `memory-monitor` / `network-indicator` / `scroll-progress` | self-contained dev/status widgets |

**usefy is NOT a UI kit.** We do **not** ship the primitives a design system
already gives you — Button, Input, Slider, Rating, Checkbox, Switch, Tabs,
Accordion, Modal/Dialog, Drawer, Tooltip, Popover, Toast, Dropdown/Context-menu,
Select/Combobox, Tag-input, Avatar, Badge, Skeleton, Breadcrumb, Pagination,
Color-picker. Those are shadcn/Radix/MUI/Mantine territory. Building them would
make usefy a me-too component kit — not the point.

### The test for "is this a usefy standalone?"

1. **Would someone install it as its own package?** Does it already exist as a
   standalone library people seek out (canvas-confetti, signature_pad, qrcode,
   wavesurfer, react-easy-crop, emoji-mart, react-window, cobe…)? If instead
   it's "a component you'd get inside a UI library," it's out.
2. **Is there a real engine?** A hand-written core worth unit-testing — an
   algorithm, a canvas/geometry/parse/physics engine, a windowing/layout
   engine. Enough substance ("공수") that one package earns its keep.
3. **Does it reuse the hook family and stay zero-dep/headless?** Composes
   `@usefy/use-*`, ships a framework-free `./headless` core, seams out heavy
   deps (parser/highlighter) rather than bundling them.
4. **Can the browser-QA pipeline prove it?** Its quality is something you can
   *see or measure* (CLAUDE.md "Quality bar").
5. **Is the reason honest — checked, not invented?** Look up the incumbents'
   npm publish dates and weekly downloads before committing.

   **A living incumbent is not a veto.** Every standalone here shipped against
   one: `confetti` against canvas-confetti at 8.8M weekly, `spotlight-tour`
   against a driver.js released nine days earlier, `virtual-keyboard` against a
   react-simple-keyboard released three days earlier. If "the market must be
   empty" were the rule, none of them would exist.

   What this gate catches is a **false premise** — writing "nobody maintains
   this" in the SPEC when the numbers say otherwise (the diff-viewer lesson:
   the "stalled" fork was actually the actively-maintained, more-used one), or
   not being able to state a reason at all. "It completes a set we already
   ship" and "it shares an engine we already wrote" are perfectly good reasons.
   "The incumbent is dead" is only a good reason when it's true.
6. **Is there an independent oracle?** Something outside our own code that can
   say "this output is correct" — a reference implementation to diff against, a
   consumer that reads the output back, a closed-form answer, a published test
   vector. This is a *tiebreaker, not a veto*: `confetti` and `spotlight-tour`
   shipped fine without one. But candidates that have it reach a demonstrably
   higher bar for the same effort (the qr-code lesson, below), so when two ideas
   look equally good, take the one you can prove.

---

## Generation & algorithm engines

Pure, hand-testable cores — the strongest house-test fit, like the Myers engine.

| Idea | What it is | The engine / depth | Reuse |
|---|---|---|---|
| ~~**qr-scanner**~~ | ~~Camera / image → decode~~ | **Shipped** (see "What shipping `qr-scanner` taught us") | — |
| **word-cloud** | Text → laid-out word cloud | Spiral placement with collision detection, frequency scaling, rotation, canvas/SVG output — a real layout algorithm | measure, resize-observer |
| **calendar-heatmap** | GitHub-style contribution grid | Date bucketing, week/month layout, color scales, tooltips, locale weeks — a self-contained data-viz feature (react-calendar-heatmap) | media-query |

## Canvas & media

Inherits the `confetti` / `signature-pad` canvas/DPR/engine know-how.

| Idea | What it is | The engine / depth | Reuse |
|---|---|---|---|
| **image-cropper** | Crop / zoom / rotate → output | Pointer + wheel + pinch gesture engine, aspect locks, rotation math, DPR-correct canvas export — react-easy-crop / cropperjs are the standalone incumbents (verify the angle: headless? modern gestures?) | measure, resize-observer, long-press |
| **pan-zoom** | Zoomable / pannable viewport | Transform-matrix engine: wheel-zoom-to-cursor, drag-pan, pinch, momentum/inertia, bounds — the react-zoom-pan-pinch niche, useful under maps/diagrams/images | measure, resize-observer, raf-state |
| **audio-waveform** | Waveform render + seek | Decode an AudioBuffer → downsampled peaks → canvas waveform, playhead/seek, regions — a wavesurfer-lite core | resize-observer, raf-state |
| **globe** | Rotating dotted globe | Orthographic geo-projection, point rasterization, auto-spin + drag, marker overlays — the cobe niche; a striking landing demo | raf-state, resize-observer, reduced-motion |

## Data & text

The `diff-viewer` line — virtualization, big-input guards, parser/render seams.

| Idea | What it is | The engine / depth | Reuse |
|---|---|---|---|
| **json-viewer** | Collapsible JSON / tree explorer | **Decided — see "Next up"** | resize-observer, intersection-observer, copy-to-clipboard |
| **virtualized-list** | Windowing engine, headless-first | Fixed/variable-row windowing, scroll anchoring, `aria-rowcount/index` — we already hand-wrote one *inside* diff-viewer. **Weakest on the list right now**: `@tanstack/react-virtual` 19.6M/wk · 0.2 mo and `react-window` 6.5M/wk · 0.2 mo, with no differentiating angle. Extract it *after* `json-viewer` ships, when two real consumers can shape the abstraction | resize-observer, isomorphic-layout-effect |
| **markdown-viewer** | Render markdown safely | Bring-your-own-parser seam (like diff-viewer's highlighter seam), safe rendering, heading anchors + TOC, no `dangerouslySetInnerHTML` on raw input | intersection-observer |
| **mentions** | `@mention` textarea | Trigger detection, caret-anchored dropdown positioning, token parsing, keyboard nav, serialized value — a self-contained rich-input feature | controllable-state, hotkeys, on-click-outside |

## Motion effects

Self-contained "delight" effects — the `confetti` character (a standalone
effect library, not a UI primitive). Browser-QA is the whole point.

| Idea | What it is | The engine / depth | Reuse |
|---|---|---|---|
| **typewriter** | Typing / deleting text effect | Multi-string cycling, variable speed + humanized jitter, cursor, reduced-motion static fallback — the react-type-animation niche | interval, reduced-motion |
| **number-ticker** | Animated number / odometer | Per-digit roll, `Intl` formatting across transitions, spring vs duration, reduced-motion — the NumberFlow niche (verify the angle) | reduced-motion, raf-state |
| **marquee** | Seamless infinite scroller | Truly gapless loop (measure + duplicate + transform), pause-on-hover, gradient edges, RTL, reduced-motion — react-fast-marquee niche; harder than it looks to make gapless | measure, resize-observer, reduced-motion |

---

## What shipping `qr-code` taught us

The previous #1 shipped, and it's worth recording *why* it went as well as it
did, because it changes how the rest of this list should be ranked.

**Two independent oracles carried the whole thing.** Every generated symbol was
checked two ways that had nothing to do with our own code: matrices compared
module-for-module against a reference encoder (all 160 version × level
combinations, zero mismatches), and rendered output read back by a real decoder
— including all 16 module × eye shape combinations, gradients on SVG *and*
canvas, and the exported PNG's own bytes. That is what let "does it scan?" be a
**test result** instead of an opinion, and it is why gate ⑥ now exists.

**Measured beats assumed, and a threshold you can't cross isn't a threshold.**
The per-shape `moduleGap` ceilings came from rendering in a browser and
decoding at five resolutions. The first pass sampled four and got `square`
wrong — and because its "safe" value equalled the hard clamp, the warning could
never fire for square modules at all. Sample past where you think the answer is.

**Budget for the review loop, and let it be adversarial.** Two `usefy-reviewer`
rounds produced six blocking findings. Round 2's worst were two demos that
called the encoder directly in render, so pasting a long value took down the
Storybook canvas and an entire product-page route — while the package's headline
promise was that an over-long value is *reported*, not thrown. The storefront
was demonstrating the opposite of the pitch. Roughly a third of the effort went
into these rounds; that is the normal cost, not an overrun.

---

## What shipping `qr-scanner` taught us

The #1 pick shipped. Four things are worth carrying forward, because each cost
real time and each is likely to recur.

**The oracle was everything it promised, and then some.** `@usefy/qr-code`
generating the ground truth turned "does it read every symbol" into a 160-combination
automated suite that passed on the *first* run of the bit-level decoder. But
agreeing with our own encoder only proves the two halves are consistent — so a
separate interop suite reads symbols from `node-qrcode` (a completely separate
implementation, every version group, level and mask) and compares recall against
jsQR on a degraded corpus. Budget for both: the second one is what proves
*correctness* rather than *consistency*.

**Browser QA found what 300 unit tests could not.** Two real defects surfaced
only when a symbol was drawn to a canvas and read back: a rotated, antialiased
symbol lost one of its three finder patterns (the diagonal cross-check compared
run lengths against a value that has no fixed expectation — a diagonal chord is
√2 × the side when axis-aligned and 1 × at 45°), and the damage demo's blots
landed on the finder patterns, so it demonstrated nothing about error
correction. Neither was reachable from the synthetic corpus. **The browser pass
is not a formality.**

**A benchmark can overturn a design decision — let it.** `maxDimension: 800`
was in the SPEC from the start as "a decode budget". Measured, it *cost* about
twice what it saved at every camera resolution, because reading every source
pixel is comparable to one detection pass over them. The cap now applies only
past a 2.5× reduction, and the resampler was rewritten to be separable; together
those made every benchmark row 1.3–4× faster. Write the benchmark before
defending the number.

**Two review rounds, and both earned their keep.** Round 1 found a real bug (two
symbols could share a finder pattern, with a *vacuous* test guarding it), a
claim in the code that was simply false (the post-correction syndrome check does
not detect miscorrection — a miscorrected word is a valid codeword), and six
exports published with no consumer. Round 2 covered the React and camera layer.
Roughly a third of the effort, as `qr-code` also found.

Two claims we wrote and then had to retract, both because they *sounded* right:
mirroring is **not** detectable from finder-pattern geometry (the patterns are
identical squares; of the two corner labellings, one always has "normal"
handedness), and a `sideEffects: false` manifest silently deletes a worker entry
that exists only for its side effect. Both were caught by measurement rather
than reasoning.

---

## Shortlist (strongest picks right now)

Ordered by how squarely they hit the usefy character — a starting point, reorder
to taste:

1. ~~**json-viewer**~~ — **decided, see "Next up" at the top.** (Its old
   justification here — "the cheapest good option, reuses diff-viewer's
   windowing directly" — was wrong on both counts; the corrections are in that
   section.)
2. **image-cropper** — substantial gesture + canvas engine, clear standalone
   demand, inherits the confetti/signature-pad canvas know-how. Weakest on gate
   ⑥: geometry and feel, with no external oracle to check the output against.
3. **audio-waveform** — a real DSP-ish engine (peaks + seek), striking demo,
   nothing UI-primitive about it. Synthetic signals give it a partial oracle.
4. **globe** — pure projection engine, an unforgettable landing-page card;
   maximal "wow per package." Projection math has closed-form answers to check
   against, but the rest is visual.

**Before committing:** run gate ⑤ — npm publish dates + weekly downloads of the
incumbents — then write the SPEC and go through the phased build + review loop
like the shipped ten.

---

## Gate ⑤ data (measured 2026-07-27)

Recorded so the next person doesn't re-measure, and so nobody writes "the
incumbent is dead" without checking. Weekly downloads / last publish.

**qr-scanner** — healthy ecosystem. The top-downloaded package looks abandoned,
which is exactly the trap: `jsqr` 1.8M / 63 mo and `html5-qrcode` 1.2M / 39 mo
are stale, but the live half is `zxing-wasm` 1.4M / 0.3 mo, `@zxing/library`
1.4M / 2.9 mo, `barcode-detector` 1.3M / 0.5 mo, `@zxing/browser` 832k / 0.7 mo,
and there *are* maintained React wrappers — `@yudiel/react-qr-scanner` 242k /
2.5 mo, `react-zxing` 72k / 1.8 mo. Note `barcode-detector` polyfills a native
browser API; the platform is absorbing this capability.

**json-viewer** — the most fragmented. `react-json-view` 1.4M but **64.6 mo**
stale, with an actively-maintained fork (`@microlink/react-json-view` 585k /
0.1 mo) — the diff-viewer pattern again. Alternatives: `react-json-view-lite`
1.6M / 10.6 mo, `react-json-tree` 1.0M / 16.8 mo, `json-edit-react` 330k /
1.1 mo. The angle to verify was **virtualization for huge payloads** —
**verified 2026-07-28**: none of the five depends on a virtualization library
and none mentions "virtual" or "window" in its README. Full table in "Next up".

**image-cropper** — no gap of any kind. `react-easy-crop` 2.7M / 0.1 mo,
`react-image-crop` 2.3M / 1.2 mo, `cropperjs` 1.6M / 3.7 mo, all current.

**audio-waveform** — `wavesurfer.js` 1.2M / 0.3 mo with an official React
wrapper (`@wavesurfer/react` 264k). Well served.

**globe** — smaller and steady: `cobe` 309k / 4.3 mo, `three-globe` 238k /
3.7 mo, `globe.gl` 181k / 2.3 mo, `react-globe.gl` 129k / 2.3 mo.

**For calibration — what the shipped ones faced:** canvas-confetti 8.8M /
9.0 mo · signature_pad 2.4M / 7.7 mo · driver.js 1.3M / **0.3 mo** ·
react-joyride 1.2M / 0.6 mo · react-simple-keyboard 122k / **0.1 mo** ·
react-diff-viewer-continued 792k / 0.4 mo. Living incumbents, every time.
