export { useFocusTrap } from "./useFocusTrap";
export type {
  UseFocusTrapOptions,
  UseFocusTrapRef,
  FocusTarget,
} from "./types";
// Public helper: computing the focusable descendants of an element is broadly
// reusable (roving tabindex, custom keyboard nav). The visibility/selector
// internals (isHidden / isFocusable / resolveFocusTarget) stay package-only.
export { getFocusableElements } from "./utils";
