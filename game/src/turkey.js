// The turkey: the player. Runs left and right, jumps fences and oven grates,
// and ducks into a hay bale to hide. Hiding only works while the turkey is
// still, on the ground, and close to a bale; a hidden turkey is invisible
// to the farmer until it moves, jumps, or the farmer walks right up to it.

import { FIELD, TURKEY } from './config.js';

export function createTurkey() {
  return {
    x: 240,
    y: FIELD.groundY - TURKEY.height,
    vx: 0,
    vy: 0,
    width: TURKEY.width,
    height: TURKEY.height,
    facing: 1,
    onGround: true,
    hiding: false,
    hidden: false,
    invulnerable: 0,
    animTime: 0,
    moving: false,
    gobbleTimer: 0,
  };
}

/**
 * Move the turkey one step. `direction` is -1, 0 or 1; `jump` starts a jump;
 * `wantHide` holds the turkey down in a bale. `nearHay` says a bale is in
 * reach. Returns 'jumped' when a jump begins, for the sound.
 */
export function updateTurkey(turkey, dt, direction, jump, wantHide, nearHay, blocked) {
  const speed = turkey.hidden ? 0 : TURKEY.runSpeed;
  let jumped = false;
  turkey.moving = direction !== 0 && !turkey.hidden;
  if (direction !== 0 && !turkey.hidden) turkey.facing = direction;
  if (blocked && direction > 0) {
    turkey.vx = 0;
  } else {
    turkey.vx = direction * speed;
  }
  turkey.x += turkey.vx * dt;
  turkey.x = Math.max(0, Math.min(9800 - turkey.width, turkey.x));

  if (jump && turkey.onGround && !turkey.hidden) {
    turkey.vy = -TURKEY.jumpSpeed;
    turkey.onGround = false;
    jumped = true;
  }
  turkey.vy += TURKEY.gravity * dt;
  turkey.y += turkey.vy * dt;
  const floor = FIELD.groundY - turkey.height;
  if (turkey.y >= floor) {
    turkey.y = floor;
    turkey.vy = 0;
    turkey.onGround = true;
  }

  const wasHidden = turkey.hidden;
  turkey.hiding = wantHide && turkey.onGround && nearHay && direction === 0;
  turkey.hidden = turkey.hiding;
  if (turkey.hidden && !wasHidden) turkey.gobbleTimer = 0;
  if (turkey.invulnerable > 0) turkey.invulnerable = Math.max(0, turkey.invulnerable - dt);
  turkey.animTime += dt * (turkey.moving ? 1.6 : 1);
  return jumped ? 'jumped' : '';
}

/** The turkey's screen-space centre, used by the farmer's line of sight. */
export function turkeyCentre(turkey) {
  return { x: turkey.x + turkey.width / 2, y: turkey.y + turkey.height / 2 };
}
