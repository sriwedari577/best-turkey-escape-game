// Farmer Jed: the chaser. Three moods drive him. CHASE: he runs at the
// turkey whenever he can see it. SEARCH: when the turkey vanishes into hay
// he slows, paces back and forth and peers into the bales near where it
// was last seen. CORNER: in the kitchen, with nowhere left to run, he is
// faster and throws his carving knives more often. He never teleports and
// never outruns a turkey that keeps moving — a narrow escape stays fair.

import { FARMER, WORLD } from './config.js';
import { turkeyCentre } from './turkey.js';

export const MOOD_CHASE = 'chase';
export const MOOD_SEARCH = 'search';
export const MOOD_CORNER = 'corner';

export function createFarmer() {
  return {
    x: -140,
    y: 0,
    width: FARMER.width,
    height: FARMER.height,
    mood: MOOD_CHASE,
    searchX: 0,
    searchDirection: 1,
    searchTimer: 0,
    knifeTimer: 2.2,
    animTime: 0,
    moving: true,
    suspicious: 0,
  };
}

/** Can the farmer see the turkey? Hidden turkeys are seen only at arm's length. */
export function farmerSeesTurkey(farmer, turkey) {
  if (turkey.hidden) {
    return Math.abs(farmer.x - turkey.x) < 60;
  }
  return true;
}

/**
 * Move the farmer one step toward the turkey. Returns 'spotted' the moment
 * a search turns back into a chase, and 'throw' when a knife leaves his hand.
 */
export function updateFarmer(farmer, turkey, dt, stageIndex, knifeReady) {
  const centre = turkeyCentre(turkey);
  const seen = farmerSeesTurkey(farmer, turkey);
  let event = '';
  const inKitchen = stageIndex === 2;

  if (farmer.mood === MOOD_SEARCH) {
    farmer.searchTimer -= dt;
    if (seen && Math.abs(farmer.x - turkey.x) < 520) {
      farmer.mood = inKitchen ? MOOD_CORNER : MOOD_CHASE;
      event = 'spotted';
    } else if (farmer.searchTimer <= 0) {
      farmer.mood = inKitchen ? MOOD_CORNER : MOOD_CHASE;
    } else {
      farmer.searchDirection = farmer.x < farmer.searchX - 160 ? 1
        : farmer.x > farmer.searchX + 160 ? -1 : farmer.searchDirection;
      farmer.x += farmer.searchDirection * FARMER.searchSpeed * dt;
    }
  }

  if (farmer.mood !== MOOD_SEARCH) {
    if (!seen) {
      farmer.mood = MOOD_SEARCH;
      // He searches where he last saw the turkey — a little way off, so a
      // turkey holding still in its bale is not found by pacing over it.
      farmer.searchX = centre.x + (farmer.x <= centre.x ? -300 : 300);
      farmer.searchTimer = 3.2;
      farmer.searchDirection = 1;
    } else {
      farmer.mood = inKitchen ? MOOD_CORNER : MOOD_CHASE;
    }
  }

  if (farmer.mood === MOOD_CHASE || farmer.mood === MOOD_CORNER) {
    const gap = centre.x - (farmer.x + farmer.width / 2);
    let speed = farmer.mood === MOOD_CORNER ? FARMER.cornerSpeed : FARMER.chaseSpeed;
    if (gap > 700) speed += FARMER.catchupBonus;
    if (gap > 10) farmer.x += speed * dt;
    farmer.moving = gap > 10;
  } else {
    farmer.moving = Math.abs(farmer.searchDirection) > 0;
  }

  farmer.x = Math.max(-160, Math.min(WORLD.length, farmer.x));
  farmer.animTime += dt * (farmer.moving ? 1.5 : 1);

  farmer.knifeTimer -= dt;
  if (farmer.knifeTimer <= 0 && seen && knifeReady && Math.abs(centre.x - farmer.x) < 760) {
    farmer.knifeTimer = inKitchen ? FARMER.knifeIntervalKitchen : FARMER.knifeInterval;
    event = 'throw';
  }
  return event;
}

/** How close the farmer is, 0 (far away) to 1 (grabbing distance). */
export function farmerPressure(farmer, turkey) {
  const gap = Math.max(0, turkey.x - farmer.x);
  return Math.max(0, Math.min(1, 1 - gap / 620));
}
