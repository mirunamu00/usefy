import { useCallback, useEffect, useRef, type KeyboardEvent } from "react";

/**
 * Roving-tabindex keyboard/D-pad navigation for the on-screen keyboard.
 *
 * Exactly one key is tabbable at a time; Arrow keys move focus (2D, geometry
 * aware), Home/End jump to the first/last key, and Escape blurs the keyboard
 * (and invokes `onEscape`, e.g. to close a floating/docked keyboard).
 * `Space`/`Enter` fall through to the native `<button>` activation.
 *
 * Keys must render with `tabIndex={-1}` and a `data-vk-key` attribute; this hook
 * promotes the appropriate one to `tabIndex={0}` imperatively (React never
 * rewrites the constant `-1` prop, so the assignment sticks).
 *
 * @param resetKey - Identity that, when it changes, re-normalizes the roving
 *   tabindex (pass the current layout, gated on open, so it runs on mount /
 *   key-set change / each open).
 * @param onEscape - Called when Escape is pressed inside the keyboard. Return
 *   `true` if it handled the key (e.g. closed the keyboard) so the event is not
 *   also bubbled to an ancestor (a parent modal, etc.).
 * @param rtl - When true, ArrowLeft/ArrowRight are mirrored so the arrows always
 *   move to the visually-adjacent key (rows render reversed under `dir="rtl"`).
 */
export function useRovingFocus<T extends HTMLElement = HTMLDivElement>(
  resetKey?: unknown,
  onEscape?: () => boolean | void,
  rtl = false
) {
  const containerRef = useRef<T>(null);
  const onEscapeRef = useRef(onEscape);
  onEscapeRef.current = onEscape;
  const rtlRef = useRef(rtl);
  rtlRef.current = rtl;

  const getKeys = useCallback((): HTMLButtonElement[] => {
    const root = containerRef.current;
    if (!root) return [];
    return Array.from(
      root.querySelectorAll<HTMLButtonElement>("button[data-vk-key]")
    ).filter((el) => !el.disabled);
  }, []);

  // The keys grouped by their DOM row, for structural up/down navigation
  // (geometry-free, so it works during SSR/tests without layout).
  const getGrid = useCallback((): HTMLButtonElement[][] => {
    const root = containerRef.current;
    if (!root) return [];
    const rows = root.querySelectorAll<HTMLElement>("[data-vk-row]");
    const rowEls = rows.length > 0 ? Array.from(rows) : Array.from(root.children);
    return rowEls
      .map((row) =>
        Array.from(
          row.querySelectorAll<HTMLButtonElement>("button[data-vk-key]")
        ).filter((el) => !el.disabled)
      )
      .filter((keys) => keys.length > 0);
  }, []);

  // Keep exactly one key tabbable (the focused one, else the first). Scoped to
  // `resetKey` (the current layout identity) so it runs on mount and when the
  // key set changes — not on every keystroke.
  useEffect(() => {
    const keys = getKeys();
    if (keys.length === 0) return;
    const active = document.activeElement;
    const focused = keys.find((k) => k === active);
    const chosen = focused ?? keys[0];
    for (const k of keys) k.tabIndex = k === chosen ? 0 : -1;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey, getKeys]);

  const focusKey = useCallback((keys: HTMLButtonElement[], target: HTMLButtonElement) => {
    for (const k of keys) k.tabIndex = k === target ? 0 : -1;
    target.focus();
  }, []);

  const onKeyDown = useCallback(
    (event: KeyboardEvent<T>) => {
      const keys = getKeys();
      if (keys.length === 0) return;

      const current =
        (document.activeElement as HTMLButtonElement | null) ?? keys[0];
      const currentIndex = keys.indexOf(current);

      // Move `delta` logical steps (with wrap) and focus the result.
      const moveBy = (delta: number) => {
        const base = currentIndex < 0 ? 0 : currentIndex;
        const i = (base + delta + keys.length) % keys.length;
        focusKey(keys, keys[i]);
      };

      switch (event.key) {
        case "ArrowLeft": {
          event.preventDefault();
          // In RTL the visually-left key is the NEXT logical key.
          moveBy(rtlRef.current ? 1 : -1);
          return;
        }
        case "ArrowRight": {
          event.preventDefault();
          moveBy(rtlRef.current ? -1 : 1);
          return;
        }
        case "ArrowDown":
        case "ArrowUp": {
          event.preventDefault();
          const target = findVertical(
            getGrid(),
            current,
            event.key === "ArrowDown"
          );
          if (target) focusKey(keys, target);
          return;
        }
        case "Home": {
          event.preventDefault();
          focusKey(keys, keys[0]);
          return;
        }
        case "End": {
          event.preventDefault();
          focusKey(keys, keys[keys.length - 1]);
          return;
        }
        case "Escape": {
          current.blur();
          const handled = onEscapeRef.current?.();
          if (handled) {
            // The keyboard consumed Escape (closed) — don't also bubble it to an
            // ancestor (e.g. a parent modal/dialog).
            event.preventDefault();
            event.stopPropagation();
          }
          return;
        }
        default:
          return;
      }
    },
    [getKeys, focusKey]
  );

  return { containerRef, onKeyDown };
}

/**
 * Move focus to the key in the adjacent row that sits at the same column index
 * (clamped to that row's length). Structural — no geometry — so it behaves
 * predictably across ragged rows and works without a layout engine.
 */
function findVertical(
  grid: HTMLButtonElement[][],
  current: HTMLButtonElement,
  down: boolean
): HTMLButtonElement | null {
  let rowIndex = -1;
  let colIndex = -1;
  for (let r = 0; r < grid.length; r++) {
    const c = grid[r].indexOf(current);
    if (c !== -1) {
      rowIndex = r;
      colIndex = c;
      break;
    }
  }
  if (rowIndex === -1) return null;

  const nextRow = down ? rowIndex + 1 : rowIndex - 1;
  const target = grid[nextRow];
  if (!target || target.length === 0) return null;
  return target[Math.min(colIndex, target.length - 1)];
}
