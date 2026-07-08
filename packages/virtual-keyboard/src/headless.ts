// Headless entry — the hook, the layout engine, layouts, the composer seam, and
// all types. It imports NO styles, so it is safe in any environment and adds no
// CSS side effects. Import from "@usefy/virtual-keyboard/headless".

// --- hook ---
export { useVirtualKeyboard } from "./useVirtualKeyboard";

// --- engine (pure) ---
export {
  resolveLayout,
  resolveKey,
  buildKeyEvent,
} from "./engine/resolveLayout";
export { applyKey } from "./engine/applyKey";
export type {
  EditState,
  ApplyKeyOptions,
  ApplyKeyResult,
} from "./engine/applyKey";
export { createLayout } from "./engine/createLayout";
export type { CreateLayoutConfig, KeyInput } from "./engine/createLayout";
export { randomizeLayout } from "./engine/randomizeLayout";

// --- composer seam ---
export { identityComposer } from "./composer/identity";

// --- built-in layouts ---
export { qwertyLayout } from "./layouts/qwerty";
export { numericLayout } from "./layouts/numeric";
export { phoneLayout } from "./layouts/phone";
export { emailLayout } from "./layouts/email";

// --- constants / helpers ---
export {
  DEFAULT_ARIA_LABEL,
  LAYOUT_NAMES,
  isModifierAction,
  isTextAction,
  keyAccessibleName,
} from "./constants";

// --- types ---
export type {
  KeyDefinition,
  KeyAction,
  KeyboardLayout,
  KeyboardModifiers,
  ResolvedLayout,
  ResolvedKey,
  VirtualKeyEvent,
  Composer,
  ComposerState,
  ComposerResult,
  UseVirtualKeyboardOptions,
  UseVirtualKeyboardReturn,
} from "./types";
