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
  // Composer working state.
  const composerStateRef = useRef<ComposerState>(
    (currentLayout.composer ?? identityComposer).reset()
  );
  // Composing text (IME): the in-progress block shown but not yet committed to
  // `value`. `composingStartRef` anchors where it sits inside `value`, so the
  // displayed string is `value[0..start] + composing + value[start..]`.
  const [composing, setComposing] = useState("");
  const composingRef = useRef("");
  composingRef.current = composing;
  const composingStartRef = useRef(0);

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
          composingStartRef.current = el.value.length;
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
      // The element shows committed `value` with the in-progress composition
      // spliced in at its anchor; `value`/`onChange` stay composition-free.
      const start = composingStartRef.current;
      const displayed =
        composing === "" ? value : value.slice(0, start) + composing + value.slice(start);
      if (el.value !== displayed) el.value = displayed;
      const pending = pendingCaretRef.current;
      if (pending && typeof el.setSelectionRange === "function") {
        el.setSelectionRange(pending.start, pending.end);
      }
    }
    pendingCaretRef.current = null;
  }, [value, composing]);

  // --- shared editing helpers -----------------------------------------------
  const getEditState = useCallback((): EditState => {
    const v = valueRef.current;
    // While composing, edits anchor at the composition start (value-space); the
    // element's caret lives in the displayed string (value + composing), which
    // we keep pinned to the end of the composing block.
    if (composingRef.current !== "") {
      const s = composingStartRef.current;
      return { value: v, selectionStart: s, selectionEnd: s };
    }
    const el = inputRefRef.current?.current;
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

  /**
   * Commit any pending composition into value-space and reset the composer.
   * Returns the post-flush edit state (value + collapsed caret). Does not itself
   * write `value` — the caller commits the final result exactly once.
   */
  const mergeComposing = useCallback((): EditState => {
    const comp = composingRef.current;
    if (comp === "") return getEditState();
    const v = valueRef.current;
    const start = composingStartRef.current;
    const caret = start + comp.length;
    composerStateRef.current = (
      currentLayoutRef.current.composer ?? identityComposer
    ).reset();
    composingRef.current = "";
    composingStartRef.current = caret;
    setComposing("");
    return {
      value: v.slice(0, start) + comp + v.slice(start),
      selectionStart: caret,
      selectionEnd: caret,
    };
  }, [getEditState]);

  /** Delete one composing unit (a jamo) from the pending block; commits nothing. */
  const applyComposerBackspace = useCallback(() => {
    const composer = currentLayoutRef.current.composer ?? identityComposer;
    const res = composer.backspace
      ? composer.backspace(composerStateRef.current)
      : { committed: "", composing: "", next: composer.reset() };
    composerStateRef.current = res.next;
    composingRef.current = res.composing;
    const caret = composingStartRef.current + res.composing.length;
    pendingCaretRef.current = { start: caret, end: caret };
    setComposing(res.composing);
  }, []);

  const setLayout = useCallback(
    (name: string) => {
      if (!layoutMapRef.current.has(name)) return;
      if (name === layoutNameRef.current) return;
      // Commit whatever is composing before swapping the (possibly different) composer.
      const base = mergeComposing();
      if (base.value !== valueRef.current) commit(base);
      setLayoutName(name);
      composerStateRef.current = (
        layoutMapRef.current.get(name)?.composer ?? identityComposer
      ).reset();
      onLayoutChangeRef.current?.(name);
    },
    [mergeComposing, commit]
  );

  const toggleShift = useCallback(() => setShift((s) => !s), []);
  const toggleCapsLock = useCallback(() => setCapsLock((c) => !c), []);
  const toggleLayer = useCallback(() => setLayer((l) => !l), []);

  /** Reset the composer + composing buffer, anchoring future composition at `caret`. */
  const resetComposition = useCallback((caret: number) => {
    composerStateRef.current = (
      currentLayoutRef.current.composer ?? identityComposer
    ).reset();
    composingRef.current = "";
    composingStartRef.current = caret;
    setComposing("");
  }, []);

  const setValue = useCallback(
    (next: string) => {
      resetComposition(next.length);
      const caret = next.length;
      pendingCaretRef.current = { start: caret, end: caret };
      setValueRaw(next);
    },
    [resetComposition, setValueRaw]
  );

  const insert = useCallback(
    (text: string) => {
      if (!text) return;
      const base = mergeComposing();
      const synthetic: ResolvedKey = {
        key: text,
        type: "char",
        effectiveValue: text,
        displayLabel: text,
      };
      const result = applyKey(
        synthetic,
        base,
        modifiersRef.current,
        optionsRef.current
      );
      if (result.changed) {
        composingStartRef.current = result.selectionStart;
        commit(result);
      } else if (base.value !== valueRef.current) {
        composingStartRef.current = base.selectionStart;
        commit(base);
      }
    },
    [mergeComposing, commit]
  );

  const backspace = useCallback(() => {
    if (composingRef.current !== "") {
      applyComposerBackspace();
      return;
    }
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
    if (result.changed) {
      composingStartRef.current = result.selectionStart;
      commit(result);
    }
  }, [getEditState, commit, applyComposerBackspace]);

  const clear = useCallback(() => {
    resetComposition(0);
    if (valueRef.current === "") return;
    pendingCaretRef.current = { start: 0, end: 0 };
    setValueRaw("");
  }, [resetComposition, setValueRaw]);

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

      const isCharInsert = resolved.type === "char" && !action;
      const composer = currentLayoutRef.current.composer ?? identityComposer;
      const useComposer = composer !== identityComposer;

      // Backspace while composing deletes one jamo/unit from the pending block.
      if (action === "backspace" && composingRef.current !== "") {
        applyComposerBackspace();
        emit();
        if (mods.shift) setShift(false);
        return;
      }

      // Character insertion through a real IME composer: the press splits into
      // `committed` (frozen into value) + `composing` (shown underlined).
      if (isCharInsert && useComposer) {
        const prevState = composerStateRef.current;
        const res = composer.input(prevState, resolved.effectiveValue);

        // Anchor the composition in value-space.
        let selStart: number;
        let selEnd: number;
        if (composingRef.current === "") {
          const es = getEditState();
          selStart = es.selectionStart;
          selEnd = es.selectionEnd;
        } else {
          selStart = selEnd = composingStartRef.current;
        }

        const baseValue = valueRef.current;
        const proposed = res.committed
          ? baseValue.slice(0, selStart) + res.committed + baseValue.slice(selEnd)
          : baseValue;
        const opts = optionsRef.current;
        // Enforce maxLength against the *displayed* length (committed value plus
        // the pending block) so a composition can't overflow when it flushes.
        const withinMax =
          opts.maxLength == null ||
          proposed.length + res.composing.length <= opts.maxLength;
        const allowed =
          !res.committed || !opts.keyFilter || opts.keyFilter(res.committed, proposed);
        if (!withinMax || !allowed) {
          // Rejected — undo the composer step so nothing (incl. Shift) burns.
          composerStateRef.current = prevState;
          emit();
          return;
        }
        const nextValue = proposed;
        const start = res.committed ? selStart + res.committed.length : selStart;

        composerStateRef.current = res.next;
        composingRef.current = res.composing;
        composingStartRef.current = start;
        const caret = start + res.composing.length;
        pendingCaretRef.current = { start: caret, end: caret };
        setComposing(res.composing);
        if (nextValue !== valueRef.current) setValueRaw(nextValue);

        emit();
        if (mods.shift) setShift(false);
        return;
      }

      // Everything else (identity char insert; space/enter/tab/clear; plain
      // backspace): commit any pending composition first, then apply the key.
      const base = composingRef.current !== "" ? mergeComposing() : getEditState();
      let insertKey = resolved;
      if (isCharInsert) {
        const res = identityComposer.input(
          composerStateRef.current,
          resolved.effectiveValue
        );
        composerStateRef.current = res.next;
        insertKey = { ...resolved, effectiveValue: res.committed };
      }

      const result = applyKey(insertKey, base, mods, optionsRef.current);

      if (result.submit) {
        // `result.value` reflects a just-flushed composition; `valueRef` may
        // still hold the pre-flush value until the state update lands.
        onEnterRef.current?.(result.value);
      }
      if (result.changed) {
        composingStartRef.current = result.selectionStart;
        commit(result);
      } else if (base.value !== valueRef.current) {
        // The flush changed value even though the action itself was a no-op.
        composingStartRef.current = base.selectionStart;
        commit(base);
      }
      onKeyPressRef.current?.(rawKey, result.event);

      // A one-shot Shift clears only when the press actually did something — a
      // key rejected by maxLength/keyFilter (or a no-op) must not burn it.
      if (mods.shift && (result.changed || result.submit)) setShift(false);
    },
    [
      getEditState,
      mergeComposing,
      applyComposerBackspace,
      commit,
      setLayout,
      toggleShift,
      toggleCapsLock,
      toggleLayer,
    ]
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
    composing,
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
