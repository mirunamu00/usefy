// Opt-in Korean IME subpath — the 두벌식 composer and its pre-wired layout.
// Tree-shakeable and separate from the main entry so the Hangul automaton only
// ships when you import it: `@usefy/virtual-keyboard/hangul`. Imports NO styles.

export { hangulComposer } from "./composer/hangul";
export { hangulLayout } from "./layouts/hangul";
