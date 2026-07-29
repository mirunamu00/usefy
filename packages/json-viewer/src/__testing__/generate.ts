/**
 * Seeded generators for the engine suite (SPEC.md §7).
 *
 * Every random tree and every random operation sequence comes from a seed, so
 * a failure is reproducible from the seed printed in the assertion rather than
 * from "it was wrong at row 4 000 that one time". The house rule inherited from
 * `@usefy/qr-scanner`'s degradation corpus.
 *
 * Test-only. Never exported from the package.
 */

/** A tiny deterministic PRNG (mulberry32) — same sequence everywhere, forever. */
export function makeRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface GenerateOptions {
  /** Maximum nesting depth. @defaultValue 5 */
  maxDepth?: number;
  /** Maximum children per container. @defaultValue 6 */
  maxBreadth?: number;
  /** Probability that a node at a legal depth is a container. @defaultValue 0.55 */
  containerChance?: number;
  /** Include `Map`, `Set`, `Date`, `BigInt`, `undefined`. @defaultValue false */
  exotic?: boolean;
}

const WORDS = [
  "id",
  "name",
  "value",
  "items",
  "error",
  "user",
  "meta",
  "a b",
  "with/slash",
  "with~tilde",
  "",
  "0",
  "π",
  // Control characters and quotes belong here for the same reason the slash
  // and the tilde do: they are what path formatting actually gets wrong, and a
  // generator that only emits `foo` makes the round-trip oracle vacuous.
  "tab\there",
  "nl\nhere",
  "back\\slash",
  "it's",
  'quo"te',
];

/**
 * Build a random JSON-ish value.
 *
 * Key names deliberately include the awkward ones — an empty string, a
 * numeric-looking key, a slash, a tilde, a non-ASCII character — because those
 * are what break path formatting, and a generator that only emits `foo` proves
 * nothing about RFC 6901 escaping.
 */
export function generateValue(
  random: () => number,
  options: GenerateOptions = {},
  depth = 0,
): unknown {
  const {
    maxDepth = 5,
    maxBreadth = 6,
    containerChance = 0.55,
    exotic = false,
  } = options;

  const canNest = depth < maxDepth;
  if (canNest && random() < containerChance) {
    const count = Math.floor(random() * (maxBreadth + 1));
    const shape = random();

    if (exotic && shape < 0.12) {
      const map = new Map<string, unknown>();
      for (let i = 0; i < count; i++) {
        map.set(`k${i}`, generateValue(random, options, depth + 1));
      }
      return map;
    }
    if (exotic && shape < 0.2) {
      const set = new Set<unknown>();
      for (let i = 0; i < count; i++) set.add(`s${i}-${Math.floor(random() * 1000)}`);
      return set;
    }
    if (shape < 0.6) {
      const array: unknown[] = [];
      for (let i = 0; i < count; i++) {
        array.push(generateValue(random, options, depth + 1));
      }
      return array;
    }

    const object: Record<string, unknown> = {};
    const used = new Set<string>();
    for (let i = 0; i < count; i++) {
      let key = WORDS[Math.floor(random() * WORDS.length)]!;
      while (used.has(key)) key = `${key}_${i}`;
      used.add(key);
      object[key] = generateValue(random, options, depth + 1);
    }
    return object;
  }

  const leaf = random();
  if (exotic && leaf < 0.06) return undefined;
  if (exotic && leaf < 0.1) return new Date(Math.floor(random() * 1e12));
  if (exotic && leaf < 0.14) return BigInt(Math.floor(random() * 1e9));
  if (leaf < 0.35) return WORDS[Math.floor(random() * WORDS.length)];
  if (leaf < 0.6) return Math.floor(random() * 10000);
  if (leaf < 0.75) return random() < 0.5;
  if (leaf < 0.85) return null;
  return `text-${Math.floor(random() * 1e6)}`;
}

/**
 * A wide, deep, uniform tree for the performance suites.
 *
 * `breadth ** depth` leaves, built iteratively so the generator itself is not
 * what runs out of stack.
 */
export function generateWide(breadth: number, depth: number): unknown {
  let level: unknown = { leaf: true, n: 0 };
  for (let d = 0; d < depth; d++) {
    const next: unknown[] = new Array(breadth);
    for (let i = 0; i < breadth; i++) next[i] = level;
    level = { items: next, depth: d };
  }
  return level;
}
