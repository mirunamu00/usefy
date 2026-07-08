// Main entry — the styled component plus the full headless surface (hook,
// engine, layouts, composer, types). Importing this entry injects the
// component's CSS at runtime (see tsup.config.ts).

// --- styled component ---
export { VirtualKeyboard } from "./VirtualKeyboard";
export type {
  VirtualKeyboardProps,
  VirtualKeyboardClassNames,
} from "./VirtualKeyboard";

// --- everything headless (hook + engine + layouts + composer + types) ---
export * from "./headless";
