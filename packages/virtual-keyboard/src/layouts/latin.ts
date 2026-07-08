import type { KeyDefinition } from "../types";

/**
 * Accent long-press **variants** shared across the Latin layout catalog, keyed
 * by the base letter. Mirrors the set the built-in {@link qwertyLayout} exposes
 * so every Latin layout offers the same accents regardless of where a letter
 * physically sits (é on `e`, ç on `c`, …).
 */
export const LATIN_VARIANTS: Record<string, string[]> = {
  a: ["à", "á", "â", "ä", "å", "æ", "ã"],
  c: ["ç", "ć", "č"],
  e: ["é", "è", "ê", "ë", "ē", "ę"],
  i: ["í", "ì", "î", "ï", "ī"],
  n: ["ñ", "ń"],
  o: ["ó", "ò", "ô", "ö", "õ", "ø"],
  s: ["ß", "ś", "š"],
  u: ["ú", "ù", "û", "ü", "ū"],
  y: ["ý", "ÿ"],
  z: ["ž", "ź", "ż"],
};

/**
 * Build a `char` key for a Latin-catalog layout. Attaches the symbol-layer glyph
 * (`layerKey`) when given and auto-attaches this letter's accent {@link LATIN_VARIANTS}
 * unless an explicit `variants` list is supplied (pass `[]` to opt out).
 */
export function ck(
  key: string,
  layerKey?: string,
  variants?: string[]
): KeyDefinition {
  const def: KeyDefinition = { key, type: "char" };
  if (layerKey !== undefined) def.layerKey = layerKey;
  const v = variants ?? LATIN_VARIANTS[key];
  if (v && v.length > 0) def.variants = v;
  return def;
}
