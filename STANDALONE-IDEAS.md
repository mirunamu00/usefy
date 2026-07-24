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
5. **Is the gap real — verified, not assumed?** Check the incumbents' npm
   publish dates + weekly downloads before committing (the diff-viewer lesson:
   the "stalled" fork was actually the actively-maintained, more-used one).

---

## Generation & algorithm engines

Pure, hand-testable cores — the strongest house-test fit, like the Myers engine.

| Idea | What it is | The engine / depth | Reuse |
|---|---|---|---|
| **qr-code** | QR (and barcode) generator | Reed–Solomon error correction, mask-pattern selection, matrix encoding — a genuinely pure algorithm, 100%-testable, zero-dep, SVG **and** canvas/PNG export like signature-pad | — (pure) |
| **qr-scanner** | Camera → decode | getUserMedia stream + a QR/1D decode engine (jsQR/ZXing territory) — locator patterns, perspective correction; pairs with `qr-code` for a scan/generate set | permission, event-listener |
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

## Shortlist (strongest picks right now)

Ordered by how squarely they hit the usefy character — a starting point, reorder
to taste:

1. **qr-code** — a genuinely pure algorithm (perfect house-test fit), zero-dep,
   exportable like signature-pad, ubiquitous demand, crisp demo. The cleanest
   "self-contained feature library" on the list.
2. **image-cropper** — substantial gesture + canvas engine, clear standalone
   demand, inherits the confetti/signature-pad canvas know-how.
3. **json-viewer** — reuses diff-viewer's virtualization directly; a feature
   people install on its own; strong data-line continuation.
4. **audio-waveform** — a real DSP-ish engine (peaks + seek), striking demo,
   nothing UI-primitive about it.
5. **globe** — pure projection engine, an unforgettable landing-page card;
   maximal "wow per package."

**Before committing:** run the §"gap is real" check — npm publish dates +
weekly downloads of the incumbents — then write the SPEC and go through the
phased build + review loop like the shipped eight.
