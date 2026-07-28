/**
 * Turning bytes into text — the part of QR decoding that is a standards
 * problem rather than a mathematical one.
 *
 * Every mapping here goes through the platform's `TextDecoder`, so no encoding
 * table ships in the bundle. When a runtime does not know an encoding the
 * symbol declared, the affected segment reports `text: undefined` and keeps its
 * `bytes` — losing the payload would be a far worse outcome than losing the
 * convenience of a decoded string.
 */

/**
 * ECI assignment numbers → `TextDecoder` labels (AIM ECI specification).
 *
 * Only encodings the WHATWG Encoding Standard actually defines are listed;
 * anything else (notably CP437 for ECI 0/2, which browsers do not implement)
 * is deliberately absent so it degrades to bytes rather than to *wrong* text.
 *
 * One platform caveat worth knowing: Node's ICU-backed `TextDecoder` maps the
 * 0x80–0x9F range of the `windows-125x` family to the matching C1 control
 * characters, where browsers follow the Encoding Standard and map them to
 * printable glyphs (0x80 → `€` in windows-1252). Text from those ECIs can
 * therefore differ between a browser and a Node test runner. `bytes` never
 * does, which is the reason it is always exposed.
 */
const ECI_LABELS: Readonly<Record<number, string>> = {
  1: "iso-8859-1",
  3: "iso-8859-1",
  4: "iso-8859-2",
  5: "iso-8859-3",
  6: "iso-8859-4",
  7: "iso-8859-5",
  8: "iso-8859-6",
  9: "iso-8859-7",
  10: "iso-8859-8",
  11: "iso-8859-9",
  12: "iso-8859-10",
  13: "iso-8859-11",
  15: "iso-8859-13",
  16: "iso-8859-14",
  17: "iso-8859-15",
  18: "iso-8859-16",
  20: "shift_jis",
  21: "windows-1250",
  22: "windows-1251",
  23: "windows-1252",
  24: "windows-1256",
  25: "utf-16be",
  26: "utf-8",
  27: "ascii",
  28: "big5",
  29: "gb18030",
  30: "euc-kr",
  170: "ascii",
};

/** Cached decoders — constructing one per segment would dominate a fast decode. */
const decoders = new Map<string, TextDecoder | null>();

function decoderFor(label: string): TextDecoder | null {
  const cached = decoders.get(label);
  if (cached !== undefined) return cached;

  let decoder: TextDecoder | null = null;
  try {
    decoder = new TextDecoder(label, { fatal: false });
  } catch {
    // The runtime does not implement this encoding (common for shift_jis and
    // the ISO-8859 family in size-optimised or older JS engines).
    decoder = null;
  }
  decoders.set(label, decoder);
  return decoder;
}

/** Whether a byte sequence is well-formed UTF-8. */
export function isValidUtf8(bytes: Readonly<Uint8Array>): boolean {
  let i = 0;
  while (i < bytes.length) {
    const byte = bytes[i]!;
    let extra: number;
    let codePoint: number;

    if (byte <= 0x7f) {
      i++;
      continue;
    } else if (byte >= 0xc2 && byte <= 0xdf) {
      extra = 1;
      codePoint = byte & 0x1f;
    } else if (byte >= 0xe0 && byte <= 0xef) {
      extra = 2;
      codePoint = byte & 0x0f;
    } else if (byte >= 0xf0 && byte <= 0xf4) {
      extra = 3;
      codePoint = byte & 0x07;
    } else {
      return false; // continuation byte in a leading position, or 0xC0/0xC1/0xF5+
    }

    if (i + extra >= bytes.length) return false;
    for (let k = 1; k <= extra; k++) {
      const continuation = bytes[i + k]!;
      if ((continuation & 0xc0) !== 0x80) return false;
      codePoint = (codePoint << 6) | (continuation & 0x3f);
    }

    // Reject overlong forms and surrogates, which is what separates "valid
    // UTF-8" from "bytes that happen to have the right high bits".
    if (extra === 2 && codePoint < 0x800) return false;
    if (extra === 3 && (codePoint < 0x10000 || codePoint > 0x10ffff)) return false;
    if (codePoint >= 0xd800 && codePoint <= 0xdfff) return false;

    i += extra + 1;
  }
  return true;
}

/**
 * Decode a byte-mode segment that declared no ECI.
 *
 * ISO/IEC 18004 says the default is ISO-8859-1. The world emits UTF-8 without
 * an ECI header anyway — phones, ticketing systems and every "just put the URL
 * in" generator — so this follows what real scanners do: UTF-8 when the bytes
 * are valid UTF-8, ISO-8859-1 otherwise. `bytes` is always exposed alongside,
 * so a consumer who knows better can disagree (SPEC decision #8).
 */
export function decodeDefaultCharset(bytes: Readonly<Uint8Array>): string | undefined {
  const label = isValidUtf8(bytes) ? "utf-8" : "iso-8859-1";
  return decodeWithLabel(bytes, label);
}

/** Decode with a specific `TextDecoder` label, or `undefined` if unsupported. */
export function decodeWithLabel(
  bytes: Readonly<Uint8Array>,
  label: string,
): string | undefined {
  const decoder = decoderFor(label);
  if (!decoder) return undefined;
  // TextDecoder needs a real (non-readonly) view; the cast is safe because it
  // only ever reads.
  return decoder.decode(bytes as Uint8Array);
}

/**
 * Decode a segment's bytes using the ECI in effect.
 *
 * @param eci - The ECI assignment number, or `undefined` for the default.
 */
export function decodeSegmentText(
  bytes: Readonly<Uint8Array>,
  eci: number | undefined,
): string | undefined {
  if (eci === undefined) return decodeDefaultCharset(bytes);
  const label = ECI_LABELS[eci];
  if (!label) return undefined;
  return decodeWithLabel(bytes, label);
}

/** The `TextDecoder` label an ECI maps to, if this package knows one. */
export function eciLabel(eci: number): string | undefined {
  return ECI_LABELS[eci];
}
