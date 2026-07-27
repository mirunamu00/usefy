import type { EncodeOptions, ErrorCorrectionLevel, QRMatrix, QRSegment } from "../types";
import { QRCapacityError } from "../errors";
import { MAX_VERSION, MIN_VERSION, dataCapacityBits } from "./capacity";
import { buildBitStream } from "./bitstream";
import { interleave } from "./interleave";
import { applyBestMask } from "./mask";
import { buildMatrix } from "./matrix";
import { ECI_HEADER_BITS, needsUtf8Eci, segment, segmentsBitLength, utf8Encode } from "./segment";

const LEVELS: readonly ErrorCorrectionLevel[] = ["L", "M", "Q", "H"];

/** Character-count indicators widen at versions 10 and 27 — three groups total. */
function versionGroup(version: number): number {
  return version <= 9 ? 0 : version <= 26 ? 1 : 2;
}

function normalizeVersion(value: unknown, name: string): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "number" || !Number.isInteger(value) || value < MIN_VERSION || value > MAX_VERSION) {
    throw new RangeError(`${name} must be an integer ${MIN_VERSION}–${MAX_VERSION}, got ${String(value)}`);
  }
  return value;
}

/**
 * Encode data into a complete, masked QR symbol.
 *
 * Automatically picks the smallest version that fits, splits the payload into
 * the cheapest mix of encoding modes, and chooses the mask pattern with the
 * lowest penalty score. Every step can be overridden through {@link EncodeOptions}
 * when a stable size or a deterministic output matters more.
 *
 * @param data - Text (encoded as UTF-8, with an ECI header when needed) or raw bytes.
 * @throws {QRCapacityError} when the data cannot fit at the requested level.
 *
 * @example
 * ```ts
 * const qr = encodeQR("https://usefy.dev", { level: "Q" });
 * console.log(qr.version, qr.size, qr.get(0, 0));
 * ```
 */
export function encodeQR(data: string | Uint8Array, options: EncodeOptions = {}): QRMatrix {
  const level = options.level ?? "M";
  if (!LEVELS.includes(level)) {
    throw new RangeError(`Error-correction level must be one of L, M, Q, H — got ${String(level)}`);
  }

  const isText = typeof data === "string";
  const bytes = isText ? utf8Encode(data) : data;
  // Raw bytes are passed through verbatim: the caller owns their charset, and
  // silently declaring UTF-8 over arbitrary binary would be a lie.
  const useEci = isText && options.eci !== false && needsUtf8Eci(bytes);
  const eciBits = useEci ? ECI_HEADER_BITS : 0;

  const forcedVersion = normalizeVersion(options.version, "version");
  const minVersion = normalizeVersion(options.minVersion, "minVersion") ?? MIN_VERSION;

  let version: number;
  let segments: QRSegment[];

  if (forcedVersion !== undefined) {
    version = forcedVersion;
    segments = segment(bytes, version);
    const needed = eciBits + segmentsBitLength(segments, version);
    const capacity = dataCapacityBits(version, level);
    if (needed > capacity) {
      throw new QRCapacityError({ needed, capacity, level, maxVersion: version });
    }
  } else {
    // Segmentation only changes at the two group boundaries, so it is computed
    // at most three times rather than once per candidate version.
    let group = -1;
    let candidate: QRSegment[] = [];
    let lastNeeded = 0;
    let lastCapacity = 0;
    let found = -1;

    for (let v = Math.max(minVersion, MIN_VERSION); v <= MAX_VERSION; v++) {
      if (versionGroup(v) !== group) {
        group = versionGroup(v);
        candidate = segment(bytes, v);
      }
      lastNeeded = eciBits + segmentsBitLength(candidate, v);
      lastCapacity = dataCapacityBits(v, level);
      if (lastNeeded <= lastCapacity) {
        found = v;
        break;
      }
    }

    if (found < 0) {
      throw new QRCapacityError({
        needed: lastNeeded,
        capacity: lastCapacity,
        level,
        maxVersion: MAX_VERSION,
      });
    }
    version = found;
    segments = candidate;
  }

  const codewords = buildBitStream(segments, version, level, useEci);
  const interleaved = interleave(codewords, version, level);
  const raw = buildMatrix(interleaved, version, level);
  return applyBestMask(raw, options.mask);
}
