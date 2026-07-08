import type { Composer } from "../types";

/**
 * The default 1:1 composer: every key commits immediately and nothing is ever
 * left composing. This is the seam future IME composers (Hangul 두벌식, etc.)
 * will slot into without a breaking API change.
 *
 * @example
 * ```ts
 * const s = identityComposer.reset();
 * identityComposer.input(s, "a"); // → { committed: "a", composing: "", next: s }
 * ```
 */
export const identityComposer: Composer = {
  input(state, key) {
    return { committed: key, composing: "", next: state };
  },
  flush(state) {
    return { committed: "", composing: "", next: state };
  },
  reset() {
    return { buffer: "" };
  },
};
