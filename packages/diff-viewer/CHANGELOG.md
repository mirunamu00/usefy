# @usefy/diff-viewer

## 0.2.0

### Minor Changes

- 576ca46: New package: `@usefy/diff-viewer` — text diff viewer for React with a hand-written, zero-dependency diff engine.

  - **Diff engine**: Myers O(ND) with a linear-space middle-snake refinement (O(N+M) memory), provably optimal (asserted against an independent DP-LCS oracle), plus word-level intra-line diffing gated by a similarity threshold; CJK-aware tokenizer (Han/Kana per character, Hangul per word)
  - **Two layers**: `<DiffViewer />` component (split/unified views, collapsible context, virtualization, theming, `renderContent` seam) → framework-free `computeDiff` via `@usefy/diff-viewer/headless`
  - **Two views, one model**: `split` and `unified` render the same `DiffLine` objects; collapsed context travels _inside_ the result, so a pre-computed `diff` prop can expand with no source texts
  - **Big inputs stay usable**: row virtualization keeps a 20,000-line diff at ~45 rows in the DOM at 60 fps; first paint windows from an estimated viewport rather than materializing every row
  - **Honest guards**: `maxLines`/`maxBytes` bound size, `maxEditDistance` bounds cost (Myers is O(N·D)); a tripped guard returns `truncated` with a "diff anyway" escape hatch, and `truncatedReason` distinguishes "too large" from "too different"; `inlineBudgetExhausted` surfaces degraded highlighting
  - **Bring your own highlighter**: a `renderContent` seam hands you plain strings/segments; no bundled syntax library. Content always renders as text nodes (never `dangerouslySetInnerHTML`)
  - **Accessible**: real `<table>` semantics, one row header per row, visually-hidden "Added"/"Removed" labels (change type never colour alone), descriptive keyboard-operable expanders, truthful `aria-rowcount`/`aria-rowindex` under virtualization
  - **Robustness**: SSR & StrictMode safe, React 18 & 19, themeable via `--usefy-diff-*` CSS variables (light/dark/system), NaN/Infinity option guards throughout; styles inject at runtime with a `./styles.css` export
