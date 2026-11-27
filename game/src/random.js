// A small seeded random number generator (mulberry32), so a fixed seed always
// builds the same farm: the same fences, hay bales, corn and ovens, in the
// same places, for screenshot scenes and for fair replays.

/** Return a function that yields deterministic pseudo-random numbers in [0, 1). */
export function createRandom(seed) {
  let state = (seed >>> 0) || 0x9e3779b9;
  return function random() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick an integer in [min, max] from the given random source. */
export function randomInt(random, min, max) {
  return min + Math.floor(random() * (max - min + 1));
}
