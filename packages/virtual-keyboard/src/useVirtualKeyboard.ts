import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
} from "react";
import { useControllableState } from "@usefy/use-controllable-state";
import { DEFAULT_ARIA_LABEL } from "./constants";
import { getKeyButtonProps } from "./keyProps";
import { applyKey, type ApplyKeyOptions, type EditState } from "./engine/applyKey";
import {
  buildKeyEvent,
  resolveKey,
  resolveLayout,
} from "./engine/resolveLayout";
import { identityComposer } from "./composer/identity";
import { qwertyLayout } from "./layouts/qwerty";
import type {
  ComposerState,
  KeyboardLayout,
  KeyboardModifiers,
  KeyDefinition,
  ResolvedKey,
  UseVirtualKeyboardOptions,
  UseVirtualKeyboardReturn,
} from "./types";

/** SSR-safe layout effect: falls back to `useEffect` on the server. */
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** Normalize the `layouts` option into an ordered, name-keyed registry. */
function toLayoutList(
  layouts: UseVirtualKeyboardOptions["layouts"]
): KeyboardLayout[] {
  if (!layouts) return [qwertyLayout];
  const list = Array.isArray(layouts) ? layouts : [layouts];
  return list.length > 0 ? list : [qwertyLayout];
}

interface Caret {
  start: number;
  end: number;
}

/**
 * The headless engine behind {@link VirtualKeyboard}: modifier state, the layout
 * engine, caret-aware value editing, and prop-getters with a11y baked in. Use it
 * to build a bespoke on-screen keyboard UI while reusing all of the logic.
 *
 * Supports three input modes:
 * - **Event-emit** — read `value` / subscribe to `onChange` / `onKeyPress` and
 *   own your own input.
 * - **Controlled / uncontrolled** — pass `value`+`onChange`, or `defaultValue`.
 * - **Ref-bound** — pass `inputRef` and the hook writes into that element,
 *   tracking and restoring the caret.
 *
 * @param options - See {@link UseVirtualKeyboardOptions}.
 * @returns State, imperative controls, and prop-getters — see {@link UseVirtualKeyboardReturn}.
 *
 * @example
 * ```tsx
 * function Search() {
 *   const inputRef = useRef<HTMLInputElement>(null);
 *   const kb = useVirtualKeyboard({ inputRef, submitOnEnter: true, onEnter: runSearch });
 *   return (
 *     <>
 *       <input ref={inputRef} />
 *       <div {...kb.getKeyboardProps()}>
 *         {kb.layout.rows.map((row, r) => (
 *           <div key={r} {...kb.getRowProps(r)}>
 *             {row.map((key, k) => <button key={k} {...kb.getKeyProps(key)}>{key.displayLabel}</button>)}
 *           </div>
 *         ))}
 *       </div>
 *     </>
 *   );
 * }
 * ```
 */
export function useVirtualKeyboard(
  options: UseVirtualKeyboardOptions = {}
): UseVirtualKeyboardReturn {
  const {
    layouts,
    defaultLayout,
    value: controlledValue,
    defaultValue,
    onChange,
    inputRef,
    maxLength,
    keyFilter,
    submitOnEnter,
    ariaLabel = DEFAULT_ARIA_LABEL,
    onKeyPress,
    onEnter,
    onLayoutChange,
  } = options;

  // --- layouts registry -----------------------------------------------------
  const layoutList = useMemo(() => toLayoutList(layouts), [layouts]);
  const layoutMap = useMemo(() => {
    const map = new Map<string, KeyboardLayout>();
    for (const l of layoutList) map.set(l.name, l);
    return map;
  }, [layoutList]);
  const layoutNames = useMemo(
    () => layoutList.map((l) => l.name),
    [layoutList]
  );

  const initialLayoutName =
    defaultLayout && layoutMap.has(defaultLayout)
      ? defaultLayout
      : (layoutList[0]?.name ?? qwertyLayout.name);
  const [layoutName, setLayoutName] = useState(initialLayoutName);
  const currentLayout = layoutMap.get(layoutName) ?? layoutList[0] ?? qwertyLayout;

  // --- value ownership (controllable-state) ---------------------------------
  const [value, setValueRaw] = useControllableState<string>({
    value: controlledValue,
    defaultValue: defaultValue ?? "",
    onChange,
  });

  // --- modifiers ------------------------------------------------------------
  const [shift, setShift] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [layer, setLayer] = useState(false);
  const modifiers: KeyboardModifiers = useMemo(
    () => ({ shift, capsLock, layer }),
    [shift, capsLock, layer]
  );

  // --- refs so imperative actions stay identity-stable ----------------------
  const valueRef = useRef(value);
  valueRef.current = value;
  const modifiersRef = useRef(modifiers);
  modifiersRef.current = modifiers;
  const layoutNameRef = useRef(layoutName);
  layoutNameRef.current = layoutName;
  const currentLayoutRef = useRef(currentLayout);
  currentLayoutRef.current = currentLayout;
  const inputRefRef = useRef(inputRef);
  inputRefRef.current = inputRef;
  // layoutMap changes identity with the layouts option; mirror it via a ref so
  // setLayout keeps a permanent identity.
  const layoutMapRef = useRef(layoutMap);
  layoutMapRef.current = layoutMap;
  const ariaLabelRef = useRef(ariaLabel);
  ariaLabelRef.current = ariaLabel;

  const optionsRef = useRef<ApplyKeyOptions>({ maxLength, keyFilter, submitOnEnter });
  optionsRef.current = { maxLength, keyFilter, submitOnEnter };

  const onKeyPressRef = useRef(onKeyPress);
  onKeyPressRef.current = onKeyPress;
  const onEnterRef = useRef(onEnter);
  onEnterRef.current = onEnter;
  const onLayoutChangeRef = useRef(onLayoutChange);
  onLayoutChangeRef.current = onLayoutChange;

  // The caret to restore into a bound input after the value commits.
  const pendingCaretRef = useRef<Caret | null>(null);
  // Composer working state (identity in the MVP).
  const composerStateRef = useRef<ComposerState>(
    (currentLayout.composer ?? identityComposer).reset()
  );

  const isControlled = controlledValue !== undefined;
  const canSeedRef = useRef(!isControlled && defaultValue === undefined);
  const seedStartedRef = useRef(false);
  const awaitingSeedRef = useRef<string | null>(null);

  // --- ref-bound sync: single layout effect, restores the caret -------------
  useIsoLayoutEffect(() => {
    const el = inputRefRef.current?.current;
    if (el) {
      // Once, on first mount, adopt a pre-filled input's value instead of
      // clobbering it (only when we own the value and no seed was provided).
      if (canSeedRef.current && !seedStartedRef.current) {
        seedStartedRef.current = true;
        if (value === "" && el.value) {
          awaitingSeedRef.current = el.value;
          setValueRaw(el.value);
          return;
        }
      }
      // While the adopted value is still committing, never overwrite the input.
      // This also keeps StrictMode's synchronous setup→cleanup→setup double-run
      // from momentarily writing the input back to "".
      if (awaitingSeedRef.current !== null) {
        if (value === awaitingSeedRef.current) {
          awaitingSeedRef.current = null;
        } else {
          return;
        }
      }
      if (el.value !== value) el.value = value;
      const pending = pendingCaretRef.current;
      if (pending && typeof el.setSelectionRange === "function") {
        el.setSelectionRange(pending.start, pending.end);
      }
    }
    pendingCaretRef.current = null;
  }, [value]);

  // --- shared editing helpers -----------------------------------------------
  const getEditState = useCallback((): EditState => {
    const el = inputRefRef.current?.current;
    const v = valueRef.current;
    if (el) {
      const start = el.selectionStart ?? v.length;
      const end = el.selectionEnd ?? v.length;
      return { value: v, selectionStart: start, selectionEnd: end };
    }
    // Event-emit / controlled modes have no caret UI, so edits append at the
    // end of the current value (and Backspace pops from the end).
    return { value: v, selectionStart: v.length, selectionEnd: v.length };
  }, []);

  const commit = useCallback(
    (next: { value: string; selectionStart: number; selectionEnd: number }) => {
      pendingCaretRef.current = {
        start: next.selectionStart,
        end: next.selectionEnd,
      };
      setValueRaw(next.value);
    },
    [setValueRaw]
  );

  const setLayout = useCallback((name: string) => {
    if (!layoutMapRef.current.has(name)) return;
    if (name === layoutNameRef.current) return;
    setLayoutName(name);
    composerStateRef.current = (
      layoutMapRef.current.get(name)?.composer ?? identityComposer
    ).reset();
    onLayoutChangeRef.current?.(name);
  }, []);

  const toggleShift = useCallback(() => setShift((s) => !s), []);
  const toggleCapsLock = useCallback(() => setCapsLock((c) => !c), []);
  const toggleLayer = useCallback(() => setLayer((l) => !l), []);

  const setValue = useCallback(
    (next: string) => {
      const caret = next.length;
      pendingCaretRef.current = { start: caret, end: caret };
      setValueRaw(next);
    },
    [setValueRaw]
  );

  const insert = useCallback(
    (text: string) => {
      if (!text) return;
      const synthetic: ResolvedKey = {
        key: text,
        type: "char",
        effectiveValue: text,
        displayLabel: text,
      };
      const result = applyKey(
        synthetic,
        getEditState(),
        modifiersRef.current,
        optionsRef.current
      );
      if (result.changed) commit(result);
    },
    [getEditState, commit]
  );

  const backspace = useCallback(() => {
    const synthetic: ResolvedKey = {
      key: "Backspace",
      type: "action",
      action: "backspace",
      effectiveValue: "",
      displayLabel: "",
    };
    const result = applyKey(
      synthetic,
      getEditState(),
      modifiersRef.current,
      optionsRef.current
    );
    if (result.changed) commit(result);
  }, [getEditState, commit]);

  const clear = useCallback(() => {
    composerStateRef.current = (
      currentLayoutRef.current.composer ?? identityComposer
    ).reset();
    if (valueRef.current === "") return;
    pendingCaretRef.current = { start: 0, end: 0 };
    setValueRaw("");
  }, [setValueRaw]);

  const press = useCallback(
    (rawKey: KeyDefinition) => {
      const mods = modifiersRef.current;
      const resolved = resolveKey(rawKey, mods);
      const action = rawKey.action;

      const emit = () =>
        onKeyPressRef.current?.(rawKey, buildKeyEvent(resolved, mods));

      // Modifier & structural actions.
      switch (action) {
        case "shift":
          toggleShift();
          emit();
          return;
        case "capslock":
          toggleCapsLock();
          emit();
          return;
        case "layer":
          toggleLayer();
          emit();
          return;
        case "layout-switch":
          if (rawKey.targetLayout) setLayout(rawKey.targetLayout);
          emit();
          return;
        case "hide":
          emit();
          return;
        default:
          break;
      }

      // Text actions. Character insertions route through the layout's composer.
      // MVP ships the identity composer, which commits every key immediately, so
      // only `committed` is consumed here. A future IME composer would also need
      // `res.composing` rendered and `composer.flush()` called on structural
      // keys (space/enter/blur) — that wiring lands with the first real composer.
      let insertKey = resolved;
      const isCharInsert = resolved.type === "char" && !action;
      if (isCharInsert) {
        const composer = currentLayoutRef.current.composer ?? identityComposer;
        const res = composer.input(
          composerStateRef.current,
          resolved.effectiveValue
        );
        composerStateRef.current = res.next;
        insertKey = { ...resolved, effectiveValue: res.committed };
      }

      const result = applyKey(
        insertKey,
        getEditState(),
        mods,
        optionsRef.current
      );

      if (result.submit) {
        onEnterRef.current?.(valueRef.current);
      }
      if (result.changed) {
        commit(result);
      }
      onKeyPressRef.current?.(rawKey, result.event);

      // A one-shot Shift clears only when the press actually did something — a
      // key rejected by maxLength/keyFilter (or a no-op) must not burn it.
      if (mods.shift && (result.changed || result.submit)) setShift(false);
    },
    [getEditState, commit, setLayout, toggleShift, toggleCapsLock, toggleLayer]
  );

  // --- resolved layout to render --------------------------------------------
  const layout = useMemo(
    () => resolveLayout(currentLayout, modifiers),
    [currentLayout, modifiers]
  );

  // --- prop getters ---------------------------------------------------------
  const layoutDirRef = useRef(layout.direction);
  layoutDirRef.current = layout.direction;
  const getKeyboardProps = useCallback(
    (): HTMLAttributes<HTMLElement> => ({
      role: "group",
      "aria-label": ariaLabelRef.current,
      dir: layoutDirRef.current,
    }),
    []
  );

  // Rows are presentational — the keyboard is a `role="group"` of buttons, so a
  // `role="row"` here would be orphaned ARIA. `data-vk-row` carries the row index
  // for the grid (up/down) navigation in `useRovingFocus`.
  const getRowProps = useCallback(
    (rowIndex: number): HTMLAttributes<HTMLElement> =>
      ({ "data-vk-row": rowIndex }) as HTMLAttributes<HTMLElement>,
    []
  );

  const getKeyProps = useCallback(
    (key: ResolvedKey): ButtonHTMLAttributes<HTMLButtonElement> =>
      getKeyButtonProps(key, press),
    [press]
  );

  return {
    value,
    layout,
    layoutNames,
    modifiers,
    press,
    insert,
    backspace,
    clear,
    setValue,
    setLayout,
    toggleShift,
    toggleCapsLock,
    getKeyboardProps,
    getRowProps,
    getKeyProps,
  };
}
