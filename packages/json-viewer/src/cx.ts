/**
 * Join class names, skipping falsy ones.
 *
 * Four lines instead of a `clsx` dependency — this package ships with **zero**
 * non-`@usefy` runtime dependencies (SPEC.md §4.8), and a class-name joiner is
 * not a reason to break that.
 */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
