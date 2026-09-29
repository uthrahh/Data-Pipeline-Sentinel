/**
 * Deterministic PRNG for generating "random" fixture data (pipeline
 * durations, DQ/SLA variance, etc.). Plain `Math.random()` would make the
 * server-rendered HTML and the client's first render disagree, breaking
 * Next.js hydration — a seeded generator produces the exact same sequence
 * every time, on server and client alike.
 */

function hashSeed(seed: string): number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i += 1) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

/** mulberry32 — small, fast, good-enough distribution for fixture data. */
export function seededRandom(seed: string): () => number {
  let state = hashSeed(seed);
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic integer in [min, max], inclusive. */
export function seededInt(rand: () => number, min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

/** Deterministic float in [min, max]. */
export function seededFloat(rand: () => number, min: number, max: number): number {
  return rand() * (max - min) + min;
}

/** Deterministic pick from a non-empty array. */
export function seededPick<T>(rand: () => number, items: readonly T[]): T {
  return items[Math.floor(rand() * items.length) % items.length];
}

/**
 * Deterministic Fisher-Yates shuffle — a fresh array, seeded order. Prefer
 * this over `array.sort(() => rand() - 0.5)`: a comparator with random
 * (non-consistent) results is undefined behavior per the sort spec and can
 * call the RNG a different number of times on different engines, which
 * would make server- and client-rendered output disagree.
 */
export function seededShuffle<T>(rand: () => number, items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
