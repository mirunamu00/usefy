import type { FocusTarget } from "./types";

/**
 * CSS selector matching every element type that can, in principle, receive
 * keyboard focus. Elements that are `disabled` or have `tabindex="-1"` are
 * filtered out afterwards in {@link isFocusable} (a selector alone can't express
 * "any negative tabindex" or a disabled `[contenteditable]`).
 */
export const FOCUSABLE_SELECTOR = [
  "a[href]",
  "area[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "iframe",
  "object",
  "embed",
  "audio[controls]",
  "video[controls]",
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/**
 * Whether an element is currently hidden from interaction — and therefore not
 * focusable. Walks the ancestor chain looking for `display: none`, the `hidden`
 * attribute, or an `inert` container, and checks the element's own
 * `visibility`.
 *
 * This deliberately avoids `offsetParent`/`getBoundingClientRect` layout checks:
 * they're unreliable in non-layout environments (jsdom always reports
 * `offsetParent === null`) and would falsely hide everything. Computed-style
 * inspection works consistently in both real browsers and jsdom.
 */
export function isHidden(element: HTMLElement): boolean {
  if (element.hidden) return true;

  const view = element.ownerDocument.defaultView;
  // No window (detached document) — assume visible; other checks still apply.
  if (!view) return element.hasAttribute("inert");

  const selfStyle = view.getComputedStyle(element);
  if (
    selfStyle.visibility === "hidden" ||
    selfStyle.visibility === "collapse"
  ) {
    return true;
  }

  let node: HTMLElement | null = element;
  while (node) {
    if (node.hasAttribute("inert")) return true;
    if (view.getComputedStyle(node).display === "none") return true;
    node = node.parentElement;
  }

  return false;
}

/**
 * Whether a candidate element should participate in the focus cycle: it must
 * not have a negative `tabindex`, must not be `disabled`, and must be visible
 * (see {@link isHidden}).
 */
export function isFocusable(element: HTMLElement): boolean {
  const tabindex = element.getAttribute("tabindex");
  if (tabindex !== null && Number.parseInt(tabindex, 10) < 0) return false;
  // `:disabled` (unlike the `.disabled` IDL property) also matches controls
  // disabled *by an ancestor* `<fieldset disabled>` — those report
  // `.disabled === false` yet are genuinely non-interactive, so the IDL check
  // alone would wrongly keep them in the tab cycle. Matching the pseudo-class
  // excludes both the directly-disabled and the fieldset-disabled cases.
  if (element.matches(":disabled")) return false;
  if (isHidden(element)) return false;
  return true;
}

/**
 * Collect, **in DOM order**, every focusable descendant of `container`. Computed
 * live on demand (never cached), because the contents of a modal/dialog change
 * while it is open.
 *
 * @param container - The element to search within.
 * @returns Focusable descendants in **DOM order** — note this is not necessarily
 *   tab order: a positive `tabindex` (e.g. `tabindex="1"`) would move an element
 *   earlier in the real tab sequence, but that (discouraged) case is not
 *   reordered here.
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const nodes = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
  return Array.from(nodes).filter(isFocusable);
}

/**
 * Resolve a {@link FocusTarget} (element, ref, or getter) to a concrete element,
 * or `null` if it currently points at nothing.
 *
 * @internal
 */
export function resolveFocusTarget(target: FocusTarget): HTMLElement | null {
  if (typeof target === "function") return target();
  if (typeof HTMLElement !== "undefined" && target instanceof HTMLElement) {
    return target;
  }
  // React RefObject
  return (target as { current: HTMLElement | null }).current ?? null;
}
