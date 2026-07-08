import type { ButtonHTMLAttributes } from "react";
import { isModifierAction, keyAccessibleName } from "./constants";
import type { ResolvedKey } from "./types";

/**
 * The single source of truth for a key `<button>`'s attributes — used by both
 * the hook's `getKeyProps` (for headless / `renderKey` consumers) and the
 * built-in `Key` component, so the two never diverge.
 *
 * Includes the roving-focus contract (`tabIndex={-1}` + `data-vk-key`) so any
 * key rendered from these props participates in arrow/D-pad navigation, and an
 * `onMouseDown` that prevents the default focus steal — a ref-bound input keeps
 * visible focus while the user types with the pointer.
 */
export function getKeyButtonProps(
  key: ResolvedKey,
  onPress: (key: ResolvedKey) => void
): ButtonHTMLAttributes<HTMLButtonElement> {
  const props: ButtonHTMLAttributes<HTMLButtonElement> = {
    type: "button",
    disabled: key.disabled,
    tabIndex: -1,
    "aria-label": keyAccessibleName(key, key.effectiveValue),
    "aria-pressed": isModifierAction(key.action)
      ? Boolean(key.active)
      : undefined,
    // Keep a ref-bound input focused during pointer typing.
    onMouseDown: (event) => event.preventDefault(),
    onClick: () => onPress(key),
  };
  // data-* keys are not part of the typed literal surface — attach after.
  (props as Record<string, unknown>)["data-vk-key"] = "";
  return props;
}
