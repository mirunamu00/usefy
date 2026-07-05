export { useHotkeys } from "./useHotkeys";
export type {
  Hotkey,
  HotkeyTarget,
  HotkeyHandler,
  HotkeyMatch,
  ParsedChord,
  ParsedHotkey,
  UseHotkeysOptions,
} from "./types";
export { parseHotkey, isMacPlatform, isHotkeysSupported } from "./utils";
