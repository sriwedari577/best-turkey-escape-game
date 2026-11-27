// The dangers and the treats: thrown carving knives, oven grates that flare
// in the kitchen, fences to jump, hay bales to hide in, and corn to grab.
// Hazards are plain data the world steps; nothing here draws or plays sound.

import { FIELD, KNIFE, OVEN } from './config.js';

export function createKnife(x, y, vx, vy) {
  return { active: true, x, y, vx, vy, width: KNIFE.width, height: KNIFE.height, spin: 0 };
}

/** Throw one knife from the farmer's hand toward where the turkey stands. */
export function throwKnife(knives, farmer, turkey) {
  const fromX = farmer.x + farmer.width - 8;
  const fromY = farmer.y + 30;
  const targetX = turkey.x + turkey.width / 2;
  const targetY = turkey.y + turkey.height / 2;
  const flightTime = Math.max(0.45, Math.abs(targetX - fromX) / KNIFE.speed);
  const vx = (targetX - fromX) / flightTime;
  const vy = (targetY - fromY - 0.5 * KNIFE.gravity * flightTime * flightTime) / flightTime;
  knives.push(createKnife(fromX, fromY, vx, vy));
}

/** Fly every live knife one step; dead ones fall out of the list. */
export function updateKnives(knives, dt) {
  for (let i = knives.length - 1; i >= 0; i -= 1) {
    const knife = knives[i];
    knife.vy += KNIFE.gravity * dt;
    knife.x += knife.vx * dt;
    knife.y += knife.vy * dt;
    knife.spin += dt * 9;
    if (knife.y > FIELD.groundY + 40 || knife.x > 10000 || knife.x < -200) knives.splice(i, 1);
  }
}

export function overlaps(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

/**
 * Oven grates cycle on their own clock: calm, warning glow, then a flare
 * that burns anything standing on the grate. `oven.phase` is seconds into
 * the cycle; flaring() is true only during the burn.
 */
export function ovenCycleSeconds(oven) {
  return OVEN.calmSeconds + OVEN.warningSeconds + OVEN.flareSeconds;
}

export function ovenIsFlaring(oven) {
  const cycle = ovenCycleSeconds(oven);
  const phase = oven.phase % cycle;
  return phase >= OVEN.calmSeconds + OVEN.warningSeconds;
}

export function ovenIsWarning(oven) {
  const cycle = ovenCycleSeconds(oven);
  const phase = oven.phase % cycle;
  return phase >= OVEN.calmSeconds && phase < OVEN.calmSeconds + OVEN.warningSeconds;
}

/** Seconds until this oven's next flare starts; 0 while it is flaring. */
export function ovenFlareIn(oven) {
  const cycle = ovenCycleSeconds(oven);
  const phase = oven.phase % cycle;
  if (phase >= OVEN.calmSeconds + OVEN.warningSeconds) return 0;
  return OVEN.calmSeconds + OVEN.warningSeconds - phase;
}

export function updateOvens(ovens, dt) {
  for (const oven of ovens) oven.phase += dt;
}

/** Is the turkey standing on a flaring grate? */
export function turkeyOnFlare(turkey, ovens) {
  for (const oven of ovens) {
    if (!ovenIsFlaring(oven)) continue;
    const feet = turkey.y + turkey.height;
    if (feet >= FIELD.groundY - 4 && turkey.x + turkey.width > oven.x + 8 && turkey.x < oven.x + oven.width - 8) return oven;
  }
  return null;
}

/** The fence, if any, whose top the turkey is about to run into. */
export function fenceBlocking(turkey, fences, direction) {
  if (direction <= 0) return null;
  for (const fence of fences) {
    if (fence.jumped) continue;
    const feet = turkey.y + turkey.height;
    if (feet > FIELD.groundY - fence.height - 6 && turkey.x + turkey.width >= fence.x - 4 && turkey.x + turkey.width < fence.x + fence.width) {
      return fence;
    }
  }
  return null;
}

/** The nearest uncleared fence within `distance` pixels ahead of the turkey. */
export function fenceAhead(turkey, fences, distance) {
  const front = turkey.x + turkey.width;
  for (const fence of fences) {
    if (fence.jumped) continue;
    if (fence.x >= front - 4 && fence.x - front <= distance) return fence;
  }
  return null;
}

/** Mark a fence cleared when the turkey sails over it; returns true once. */
export function fenceCleared(turkey, fences) {
  for (const fence of fences) {
    if (fence.jumped) continue;
    if (turkey.x > fence.x + fence.width && turkey.y + turkey.height < FIELD.groundY - 10) {
      fence.jumped = true;
      return true;
    }
    if (turkey.x > fence.x + fence.width + 30) fence.jumped = true;
  }
  return false;
}

/** The nearest hay bale the turkey could duck into, or null. */
export function nearestHay(turkey, bales) {
  for (const bale of bales) {
    if (Math.abs(turkey.x + turkey.width / 2 - (bale.x + bale.width / 2)) < 74) return bale;
  }
  return null;
}

/** Corn cobs the turkey just touched; they are eaten on the spot. */
export function collectCorn(turkey, corn) {
  let eaten = 0;
  for (let i = corn.length - 1; i >= 0; i -= 1) {
    if (!corn[i].eaten && overlaps(turkey, corn[i])) {
      corn[i].eaten = true;
      eaten += 1;
    }
  }
  return eaten;
}
