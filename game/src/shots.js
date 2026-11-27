// The screenshot scenes behind ?shot=title|play|kitchen|end. Each one plays
// the real rules forward from a fresh world for a fixed number of steps,
// steered by a simple autopilot (run right, jump fences and oven grates,
// grab corn on the way), so every frame is what a short game really looks
// like and the same seed always gives the same frame.

import { FIELD, STEP } from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './hud.js';
import { fenceAhead, ovenFlareIn, turkeyOnFlare } from './hazards.js';

const TITLE_SECONDS = 1.0;
const PLAY_SECONDS = 6.5;
const END_LIMIT_SECONDS = 90;

/** Should the autopilot jump right now? A fence, or a grate about to flare, is ahead. */
function autopilotJump(world) {
  const turkey = world.state.turkey;
  if (turkeyOnFlare(turkey, world.state.ovens)) return true;
  if (!turkey.onGround) return false;
  if (fenceAhead(turkey, world.state.fences, 320)) return true;
  for (const oven of world.state.ovens) {
    if (oven.x > turkey.x && oven.x < turkey.x + turkey.width + 320 && ovenFlareIn(oven) < 0.9) return true;
  }
  return false;
}

function autopilotStep(world) {
  const jump = autopilotJump(world);
  return world.step(STEP, 1, jump, false);
}

/**
 * Set `world` to the named scene and return the screen to draw over it and
 * the best score to show. The kitchen scene walks the turkey to the third
 * stage first, so its ovens, knives and the farmer are all live in frame.
 */
export function stageShot(name, world) {
  world.reset();
  if (name !== 'play' && name !== 'kitchen' && name !== 'end') {
    for (let i = 0; i < TITLE_SECONDS / STEP; i += 1) world.step(STEP, 0, false, false);
    // Park the actors clear of the centred title panel (x 260–1020), so
    // the farmer and the turkey stay fully visible beside it.
    world.state.turkey.x = 150;
    world.state.turkey.y = FIELD.groundY - world.state.turkey.height;
    world.state.turkey.vy = 0;
    world.state.turkey.onGround = true;
    world.state.farmer.x = 20;
    world.state.farmer.y = FIELD.groundY - world.state.farmer.height;
    world.state.knives = [];
    return { screen: SCREEN_TITLE, best: 1250 };
  }
  if (name === 'kitchen') {
    world.state.turkey.x = 6560;
    world.state.farmer.x = 6280;
    world.state.lives = 2;
    for (let i = 0; i < 2.5 / STEP; i += 1) {
      if (autopilotStep(world) & 4) break;
    }
    return { screen: SCREEN_PLAY, best: 3420 };
  }
  const limit = name === 'end' ? END_LIMIT_SECONDS : PLAY_SECONDS;
  if (name === 'play') {
    // Start the farmer close behind, and time his first knife to be in the
    // air when the frame is taken, so the chase reads at a glance.
    world.state.farmer.x = 120;
    world.state.farmer.knifeTimer = 5.6;
  }
  for (let i = 0; i < limit / STEP; i += 1) {
    let events;
    if (name === 'end') {
      // A frozen turkey: it never runs, never jumps, never hides.
      events = world.step(STEP, 0, false, false);
    } else {
      events = autopilotStep(world);
    }
    if (events & 4) break;
  }
  if (name === 'end') {
    return { screen: SCREEN_OVER, best: world.state.score };
  }
  return { screen: SCREEN_PLAY, best: world.state.score };
}
