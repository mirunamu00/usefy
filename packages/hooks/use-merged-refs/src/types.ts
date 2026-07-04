import type { Ref } from "react";

/**
 * Any value React accepts as a ref for an element of type `T`, plus `undefined`
 * (an unset optional ref prop): a callback ref, a ref object, or `null` /
 * `undefined`.
 *
 * @typeParam T - The referenced value type (e.g. an element type).
 */
export type PossibleRef<T> = Ref<T> | undefined;

/**
 * A ref-cleanup function, as returned by a React 19 callback ref.
 */
export type RefCleanup = () => void;
