// The three stages of the escape, and where everything in them stands.
// One seeded pass lays out fences, hay bales, corn and ovens with fair
// spacing, so no hazard ever blocks the only way through and every bale
// has corn nearby to reward a careful turkey.

import { FIELD, OVEN, WORLD } from './config.js';
import { randomInt } from './random.js';

export function stageAt(x) {
  if (x < WORLD.farmyardEnd) return 0;
  if (x < WORLD.barnEnd) return 1;
  return 2;
}

export function stageName(index) {
  return ['FARMYARD', 'THE BARN', 'THE KITCHEN'][index];
}

/** Build the whole farm: fences, hay bales, corn cobs and oven grates. */
export function buildStages(random) {
  const fences = [];
  const bales = [];
  const corn = [];
  const ovens = [];

  function addCorn(x, y) {
    corn.push({ x, y, width: 34, height: 44, eaten: false, bob: random() * 6 });
  }
  function addFence(x) {
    fences.push({ x, width: 26, height: 74, jumped: false });
  }
  function addBale(x) {
    bales.push({ x, width: 96, height: 78 });
  }

  // Stage 1, the farmyard: wide-open running, fences to learn jumping on,
  // bales to learn hiding in, corn in easy lines.
  let x = 900;
  while (x < WORLD.farmyardEnd - 300) {
    addFence(x);
    addBale(x + randomInt(random, 260, 380));
    for (let i = 0; i < 3; i += 1) addCorn(x + 120 + i * 52, FIELD.groundY - 52);
    x += randomInt(random, 620, 780);
  }
  addBale(300);
  addCorn(420, FIELD.groundY - 52);
  addCorn(480, FIELD.groundY - 52);

  // Stage 2, the barn: tighter gaps, bales closer together, corn tucked
  // behind fences so hiding and jumping both pay.
  x = WORLD.farmyardEnd + 350;
  while (x < WORLD.barnEnd - 300) {
    addFence(x);
    addBale(x + randomInt(random, 200, 300));
    addCorn(x - 60, FIELD.groundY - 52);
    addCorn(x + 110, FIELD.groundY - 118);
    x += randomInt(random, 520, 660);
  }

  // Stage 3, the kitchen: no bales left to hide in, oven grates flare under
  // the turkey's feet, and corn sits between the grates as a dare.
  x = WORLD.barnEnd + 420;
  let ovenIndex = 0;
  while (x < WORLD.goalX - 500) {
    ovens.push({ x, width: OVEN.width, phase: (ovenIndex % 3) * 1.3 });
    addCorn(x + OVEN.width + 40, FIELD.groundY - 52);
    if (ovenIndex % 2 === 0) addFence(x + OVEN.width + 190);
    x += randomInt(random, 560, 700);
    ovenIndex += 1;
  }

  return { fences, bales, corn, ovens };
}

/** The freedom gate: a wooden arch at the end of the kitchen. */
export function goalGate() {
  return { x: WORLD.goalX, width: 120 };
}
