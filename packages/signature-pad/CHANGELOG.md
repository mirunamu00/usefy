# @usefy/signature-pad

## 0.2.0

### Minor Changes

- 0121e38: New package: `@usefy/signature-pad` — electronic signature input for React with a hand-written, zero-dependency ink engine.

  - **Ink engine**: min-distance point filtering → cubic Bézier smoothing → EMA-filtered velocity → continuously variable stroke width, with stylus pressure blending; incremental O(new points) rendering and deterministic replay
  - **Three layers**: `<SignaturePad />` component (guideline, `defaultValue`, reactive `readOnly`, imperative controller) → `useSignaturePad()` hook (edge-only state, zero renders while ink flows) → framework-free `createSignatureEngine` via `@usefy/signature-pad/headless`
  - **Exports**: ink-trimmed PNG (`{ dataURL, blob }`), true-vector SVG, and versioned, self-contained `toJSON()`/`fromJSON()` — all derived from the same geometry pipeline the canvas renders
  - **History**: stroke-level undo/redo; `clear()` as a single undoable action
  - **Robustness**: SSR & StrictMode safe, DPR-crisp (capped ×2), resize preserves ink, engine-managed `touch-action: none`, single-active-pointer palm rejection, primary-button-only mouse input, NaN/Infinity option guards, color sanitization (no markup or `url()` injection through stored documents)
