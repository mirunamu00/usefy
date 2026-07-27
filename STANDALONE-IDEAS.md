# Standalone component ideas

A browsable, non-committal shortlist of standalone components worth building for
usefy. A **reference to pick from**, not a roadmap — nothing here is scheduled,
ordered, or promised.

For the *committed* build process, see the `add-usefy-component` skill and
CLAUDE.md.

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
| **qr-scanner** | Camera / image → decode | Binarization, locator-pattern detection, perspective correction, grid sampling, then Reed–Solomon *decoding* — **half the engine already exists**: `@usefy/qr-code`'s `galois.ts` + `reedSolomon.ts` give the GF(256) arithmetic, so only syndromes + an error locator are new. Pairs with `qr-code` as a generate/scan set | permission, event-listener |
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
| **json-viewer** | Collapsible JSON / tree explorer | Virtualized tree, lazy expansion, big-payload guard, search + path highlight, copy-path — directly reuses diff-viewer's windowing + guard know-how | resize-observer, intersection-observer, copy-to-clipboard |
| **virtualized-list** | Windowing engine, headless-first | Fixed/variable-row windowing, scroll anchoring, `aria-rowcount/index` — we already hand-wrote one *inside* diff-viewer; extract and generalize it (react-window niche) | resize-observer, isomorphic-layout-effect |
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

## Shortlist (strongest picks right now)

Ordered by how squarely they hit the usefy character — a starting point, reorder
to taste:

1. **qr-scanner** — completes the generate/scan set with `@usefy/qr-code`, and
   is the only candidate that is **self-verifying**: our own encoder produces
   the ground truth, so "read back all 160 version × level combinations" is an
   automated suite nothing else here can match. The GF(256) arithmetic in
   `@usefy/qr-code` (`galois.ts`, `reedSolomon.ts`) already covers the
   Reed–Solomon half.

   *The honest premise* — the scanner ecosystem is **healthy**, not abandoned
   (see the measured table below). The reason to build it is the set, the
   shared engine and the oracle; it is **not** "nobody maintains one." Do not
   write that in the SPEC.

   *Design constraint that follows from the data:* the hard half is image
   processing, and `zxing-wasm` does it in WASM. A pure-TS decoder risks being
   visibly slower on a mid-range phone, which fails the house quality bar on its
   own terms. The answer is to make that a feature — **use the platform's
   `BarcodeDetector` where available and fall back to our own engine
   everywhere else**. That is a better product than either, and it takes the
   demand the `barcode-detector` polyfill (1.3M weekly) demonstrates.

   Both halves — native path and fallback engine, image *and* camera — are in
   scope for the first release. See CLAUDE.md, "Build it properly the first
   time": shipping the file-decode half and deferring the camera would make it
   worse than what it replaces.
2. **json-viewer** — the cheapest good option. Reuses diff-viewer's windowing
   and big-payload guards directly, and `JSON.parse` is a free oracle for the
   parse half. Least new ground of anything here.
3. **image-cropper** — substantial gesture + canvas engine, clear standalone
   demand, inherits the confetti/signature-pad canvas know-how. Weakest on gate
   ⑥: geometry and feel, with no external oracle to check the output against.
4. **audio-waveform** — a real DSP-ish engine (peaks + seek), striking demo,
   nothing UI-primitive about it. Synthetic signals give it a partial oracle.
5. **globe** — pure projection engine, an unforgettable landing-page card;
   maximal "wow per package." Projection math has closed-form answers to check
   against, but the rest is visual.

**Before committing:** run gate ⑤ — npm publish dates + weekly downloads of the
incumbents — then write the SPEC and go through the phased build + review loop
like the shipped nine.

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
1.1 mo. The angle to verify is **virtualization for huge payloads**, where
`react-json-view` is known to struggle and the lite alternatives don't really
window — and where diff-viewer's hand-written engine already applies.

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
