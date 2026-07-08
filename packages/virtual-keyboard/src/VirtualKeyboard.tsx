import React, {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { clsx } from "clsx";
import { useControllableState } from "@usefy/use-controllable-state";
import { useOnClickOutside } from "@usefy/use-on-click-outside";
import { useVirtualKeyboard } from "./useVirtualKeyboard";
import { useRovingFocus } from "./hooks/useRovingFocus";
import { useKeyFeedback } from "./hooks/useKeyFeedback";
import { Key } from "./components/Key/Key";
import { Row } from "./components/Row/Row";
import { Trigger } from "./components/Trigger/Trigger";
import { VariantsPopup } from "./components/VariantsPopup/VariantsPopup";
import { randomizeLayout } from "./engine/randomizeLayout";
import type {
  KeyboardLayout,
  ResolvedKey,
  UseVirtualKeyboardOptions,
} from "./types";
import styles from "./VirtualKeyboard.module.scss";

/** Shuffle a single layout or an array of layouts (for `randomize`). */
function shuffleLayouts(
  layouts: KeyboardLayout | KeyboardLayout[]
): KeyboardLayout | KeyboardLayout[] {
  return Array.isArray(layouts)
    ? layouts.map((l) => randomizeLayout(l))
    : randomizeLayout(layouts);
}

/** Default stacking context for the fixed docked/floating variants. */
const DEFAULT_Z_INDEX = 1000;

/** Per-part class overrides for {@link VirtualKeyboard}. */
export type VirtualKeyboardClassNames = Partial<
  Record<"root" | "row" | "key" | "keyActive" | "composing", string>
>;

/** Props for {@link VirtualKeyboard}. Extends every {@link UseVirtualKeyboardOptions}. */
export interface VirtualKeyboardProps extends UseVirtualKeyboardOptions {
  // --- presentation ---
  /**
   * Layout placement:
   * - `"inline"` (default) — rendered in normal document flow, always visible.
   * - `"docked"` — fixed as a full-width bar at the bottom of the viewport.
   * - `"floating"` — an elevated floating panel above the bottom edge.
   *
   * `docked`/`floating` honor {@link VirtualKeyboardProps.open} and
   * {@link VirtualKeyboardProps.zIndex}; `inline` ignores both (always shown).
   */
  variant?: "inline" | "docked" | "floating";
  /** Color theme. `"system"` follows `prefers-color-scheme`. */
  theme?: "light" | "dark" | "system";
  /** Per-part class overrides. */
  classNames?: VirtualKeyboardClassNames;
  /**
   * Render a key yourself (advanced). Receives the resolved key and the default
   * button props (from `getKeyProps`).
   *
   * @remarks Custom-rendered keys use the raw press path, so built-in `sound` /
   * `haptics` feedback (and the accent-variants / auto-repeat gestures) do **not**
   * apply — wire your own if you need them.
   */
  renderKey?: (
    key: ResolvedKey,
    defaultProps: React.ButtonHTMLAttributes<HTMLButtonElement>
  ) => ReactNode;
  /** Extra class on the root element. */
  className?: string;
  /** Inline style on the root element. */
  style?: CSSProperties;

  // --- visibility (docked / floating only) ---
  /**
   * Controlled open state for `docked`/`floating`. Ignored by `inline` (always
   * visible). Pair with {@link VirtualKeyboardProps.onOpenChange}.
   */
  open?: boolean;
  /**
   * Uncontrolled initial open state for `docked`/`floating`. Defaults to closed
   * when a {@link VirtualKeyboardProps.trigger} is provided, otherwise open.
   */
  defaultOpen?: boolean;
  /** Called when the open state changes (trigger click, Escape, outside click). */
  onOpenChange?: (open: boolean) => void;
  /**
   * Close `docked`/`floating` when a pointer press lands outside the keyboard.
   * The `trigger` (which toggles) and a bound `inputRef` are always excluded, so
   * clicking either does not dismiss. Defaults to `true` **when a `trigger` is
   * present** (otherwise `false`, so a trigger-less panel can't be dismissed with
   * no way to reopen it); `inline` ignores it.
   */
  closeOnClickOutside?: boolean;
  /**
   * The "keyboard icon" affordance. When provided (with `docked`/`floating`), it
   * is wrapped in an accessible toggle button (`aria-expanded` + `aria-controls`)
   * that opens/closes the keyboard; the trigger stays visible while closed.
   *
   * Content must be **non-interactive** (an icon, text, or a `<span>`) — it is
   * wrapped in a `<button>`, so a nested button/link/input is invalid.
   */
  trigger?: ReactNode;
  /**
   * Accessible name for the `trigger`. Only needed for an **icon-only** trigger;
   * when the trigger has visible text, that text is used and this is ignored so
   * the visible label stays the accessible name (WCAG 2.5.3).
   */
  triggerLabel?: string;
  /** z-index for the fixed `docked`/`floating` variants (default `1000`). */
  zIndex?: number;

  // --- gestural behaviors ---
  /**
   * Enable the accent-variants popup. Keys that declare `variants` then show a
   * corner dot and open a chooser on long-press or right-click / secondary-tap.
   */
  enableVariants?: boolean;
  /**
   * Enable auto-repeat while a repeatable action key is held. Only Backspace
   * repeats today (char keys never auto-repeat).
   */
  enableKeyRepeat?: boolean;
  /**
   * Shuffle the positions of character keys once per mount (Fisher–Yates) for
   * secure PIN pads — frustrates positional shoulder-surfing / keyloggers
   * (SPEC §10). Action/modifier keys stay put; emitted values are unchanged.
   *
   * @remarks The shuffle is computed **once per mount** and stays stable across
   * re-renders (a key never jumps between keystrokes). Consequently, changing
   * the `layouts` prop after mount has **no effect** while `randomize` is on —
   * remount the component (e.g. with a changing `key`) to reshuffle. Switching
   * *between* registered layouts within one `layouts` array still works.
   */
  randomize?: boolean;
  /**
   * Play a synthesized click on each key press. Uses the Web Audio API (no audio
   * asset, CSP-friendly); the `AudioContext` is created lazily on the first
   * press (browsers block audio before a user gesture) and no-ops where Web
   * Audio is unsupported. Feedback rides taps/clicks only — a held auto-repeat
   * does not click on every tick.
   *
   * @remarks Only applies to the built-in key rendering; {@link VirtualKeyboardProps.renderKey}
   * keys bypass it (wire your own).
   */
  sound?: boolean;
  /**
   * Vibrate briefly (~10ms) on each key press via `navigator.vibrate`, where
   * supported (mostly Android). No-ops otherwise. Independent of `sound`.
   *
   * @remarks Only applies to the built-in key rendering; {@link VirtualKeyboardProps.renderKey}
   * keys bypass it (wire your own).
   */
  haptics?: boolean;
}

/** Resolve the effective dark-mode boolean for the chosen theme (SSR-safe). */
function useResolvedDark(theme: "light" | "dark" | "system"): boolean {
  const [dark, setDark] = useState(theme === "dark");

  useEffect(() => {
    if (theme === "light") {
      setDark(false);
      return;
    }
    if (theme === "dark") {
      setDark(true);
      return;
    }
    if (typeof window === "undefined" || !window.matchMedia) {
      setDark(false);
      return;
    }
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setDark(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, [theme]);

  return dark;
}

/** One-time dev warning that `open`/`defaultOpen` are ignored by the inline variant. */
let warnedInlineOpen = false;

/**
 * Test-only: reset the one-time dev-warning flags so a spy assertion cannot be
 * defeated by a stale process-level flag set by an earlier test. Not exported
 * from the package entry.
 *
 * @internal
 */
export function __resetDevWarnings(): void {
  warnedInlineOpen = false;
}

/**
 * An on-screen (virtual) keyboard: click, tap, or D-pad your way through a
 * data-driven layout to type into any input. Built on {@link useVirtualKeyboard},
 * so all three input modes (event-emit, controlled, ref-bound) are supported.
 *
 * @example
 * ```tsx
 * import { useRef } from "react";
 * import { VirtualKeyboard, qwertyLayout } from "@usefy/virtual-keyboard";
 *
 * function Search() {
 *   const inputRef = useRef<HTMLInputElement>(null);
 *   return (
 *     <>
 *       <input ref={inputRef} placeholder="Search…" />
 *       <VirtualKeyboard inputRef={inputRef} layouts={qwertyLayout} submitOnEnter />
 *     </>
 *   );
 * }
 * ```
 */
export function VirtualKeyboard(props: VirtualKeyboardProps) {
  const {
    // presentation (consumed here)
    variant = "inline",
    theme = "system",
    classNames,
    renderKey,
    className,
    style,
    // visibility / placement (consumed here)
    open,
    defaultOpen,
    onOpenChange,
    closeOnClickOutside,
    trigger,
    triggerLabel,
    zIndex,
    // gestural behaviors (consumed here)
    enableVariants = false,
    enableKeyRepeat = false,
    randomize = false,
    sound = false,
    haptics = false,
    // layouts is transformed here (randomize) then forwarded to the hook
    layouts,
    // everything else is a hook option
    ...hookOptions
  } = props;

  const isInline = variant === "inline";
  const hasTrigger = trigger != null;

  // Shuffle char-key positions once per mount when `randomize` is on (stable
  // across re-renders via a ref, so a key never jumps between keystrokes). When
  // off, the live `layouts` prop is forwarded unchanged.
  const shuffledRef = useRef<KeyboardLayout | KeyboardLayout[] | undefined>(
    undefined
  );
  if (randomize && layouts && shuffledRef.current === undefined) {
    shuffledRef.current = shuffleLayouts(layouts);
  }
  const effectiveLayouts = randomize ? shuffledRef.current : layouts;

  const kb = useVirtualKeyboard({ ...hookOptions, layouts: effectiveLayouts });
  const isDark = useResolvedDark(theme);
  const keyboardId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const isRtl = kb.layout.direction === "rtl";

  // Opt-in press feedback (sound / haptics). Fired once per committed press.
  const playFeedback = useKeyFeedback({ sound, haptics });
  const kbPress = kb.press;
  const kbInsert = kb.insert;
  // Every real press (not a suppressed long-press base-insert) runs feedback.
  const press = useCallback(
    (key: ResolvedKey) => {
      playFeedback();
      kbPress(key);
    },
    [playFeedback, kbPress]
  );

  // Accent-variants popup state (which key opened it + its anchor button).
  const [variantsState, setVariantsState] = useState<{
    key: ResolvedKey;
    anchor: HTMLButtonElement;
  } | null>(null);
  // Mirror for reading the anchor without listing state as a dep.
  const variantsStateRef = useRef(variantsState);
  variantsStateRef.current = variantsState;

  const openVariants = useCallback(
    (key: ResolvedKey, anchor: HTMLButtonElement) => {
      setVariantsState({ key, anchor });
    },
    []
  );
  const closeVariants = useCallback(() => {
    // Return focus to the key that opened the popup (before it unmounts). Done
    // outside the state updater so it stays StrictMode-safe.
    variantsStateRef.current?.anchor.focus();
    setVariantsState(null);
  }, []);
  const selectVariant = useCallback(
    (glyph: string) => {
      playFeedback();
      kbInsert(glyph);
      closeVariants();
    },
    [playFeedback, kbInsert, closeVariants]
  );

  // Controlled/uncontrolled open state (docked/floating). Reuse the house
  // controllable-state primitive rather than hand-rolling. A keyboard with no
  // trigger defaults to open so it is not invisible-by-default.
  const [openState, setOpen] = useControllableState<boolean>({
    value: open,
    defaultValue: defaultOpen ?? !hasTrigger,
    onChange: onOpenChange,
  });
  const isOpen = isInline ? true : openState;

  const toggleOpen = useCallback(() => setOpen((o) => !o), [setOpen]);
  const closeOnEscape = useCallback((): boolean => {
    if (isInline) return false;
    setOpen(false);
    // Return focus to the invoking trigger (WAI-ARIA disclosure), rather than
    // dropping it to <body> when the keyboard unmounts.
    triggerRef.current?.focus();
    return true;
  }, [isInline, setOpen]);

  // Reset roving tabindex on mount, when the key set changes, AND each time the
  // body (re)mounts on open — gating the reset key on `isOpen` gives it a fresh
  // identity per open, so a trigger-opened keyboard always has a tab stop.
  const { containerRef, onKeyDown } = useRovingFocus<HTMLDivElement>(
    isOpen ? kb.layout : null,
    closeOnEscape,
    isRtl
  );

  // Dismiss a docked/floating panel on an outside pointer press. The trigger
  // (which toggles) and a bound input are excluded so clicking either never
  // closes the keyboard. Focus is left where the user clicked (unlike Escape,
  // which returns focus to the trigger).
  const boundInputRef = hookOptions.inputRef;
  // Default on only when there's a trigger to reopen with — a trigger-less panel
  // dismissed by an outside click would otherwise be stranded.
  const dismissOnOutside = closeOnClickOutside ?? hasTrigger;
  useOnClickOutside(containerRef, () => setOpen(false), {
    enabled: !isInline && isOpen && dismissOnOutside,
    excludeRefs: boundInputRef ? [triggerRef, boundInputRef] : [triggerRef],
  });

  // Dev-only, once: warn that `open`/`defaultOpen` do nothing for inline.
  useEffect(() => {
    const isProd =
      typeof process !== "undefined" &&
      process.env &&
      process.env.NODE_ENV === "production";
    if (isProd) return;
    if (
      isInline &&
      (open !== undefined || defaultOpen !== undefined) &&
      !warnedInlineOpen
    ) {
      warnedInlineOpen = true;
      // eslint-disable-next-line no-console
      console.warn(
        '[@usefy/virtual-keyboard] `open`/`defaultOpen` are ignored by the inline variant, which is always visible. Use variant="docked" or "floating" for open/close behavior.'
      );
    }
  }, [isInline, open, defaultOpen]);

  const keyboardProps = kb.getKeyboardProps();

  const rootStyle: CSSProperties | undefined = isInline
    ? style
    : { ...style, zIndex: zIndex ?? DEFAULT_Z_INDEX };

  const keyboardBody = (
    <div
      {...keyboardProps}
      id={keyboardId}
      ref={containerRef}
      onKeyDown={onKeyDown}
      data-variant={variant}
      className={clsx(
        styles.keyboard,
        variant === "docked" && styles.docked,
        variant === "floating" && styles.floating,
        isDark && styles.dark,
        classNames?.root,
        className
      )}
      style={rootStyle}
    >
      {kb.composing !== "" && (
        <div
          className={clsx(styles.composing, classNames?.composing)}
          data-vk-composing=""
          role="status"
        >
          <span className={styles.composingText}>{kb.composing}</span>
        </div>
      )}

      {kb.layout.rows.map((row, rowIndex) => (
        <Row
          key={rowIndex}
          {...kb.getRowProps(rowIndex)}
          className={clsx(styles.row, classNames?.row)}
        >
          {row.map((resolvedKey, keyIndex) => {
            if (renderKey) {
              return (
                <React.Fragment key={keyIndex}>
                  {renderKey(resolvedKey, kb.getKeyProps(resolvedKey))}
                </React.Fragment>
              );
            }
            return (
              <Key
                key={keyIndex}
                resolvedKey={resolvedKey}
                onPress={press}
                onRepeatPress={kbPress}
                classNames={classNames}
                enableVariants={enableVariants}
                enableKeyRepeat={enableKeyRepeat}
                onOpenVariants={openVariants}
              />
            );
          })}
        </Row>
      ))}

      {variantsState && (
        <VariantsPopup
          glyphs={[
            variantsState.key.effectiveValue,
            ...(variantsState.key.variants ?? []),
          ]}
          onSelect={selectVariant}
          onClose={closeVariants}
          left={variantsState.anchor.offsetLeft}
          top={variantsState.anchor.offsetTop}
          label={`Variants for ${variantsState.key.effectiveValue}`}
        />
      )}
    </div>
  );

  // Inline is always visible and has no trigger.
  if (isInline) return keyboardBody;

  return (
    <>
      {hasTrigger && (
        <Trigger
          ref={triggerRef}
          open={isOpen}
          controls={keyboardId}
          onToggle={toggleOpen}
          label={triggerLabel}
        >
          {trigger}
        </Trigger>
      )}
      {isOpen && keyboardBody}
    </>
  );
}

VirtualKeyboard.displayName = "VirtualKeyboard";
