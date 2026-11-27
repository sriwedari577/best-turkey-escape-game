// The screenshot scenes behind ?shot=title|play|kitchen|end. Each one plays
// the real rules forward from a fresh world for a fixed number of steps,
// steered by a simple autopilot (run right, jump fences and oven grates,
// grab corn on the way), so every frame is what a short game really looks
// like and the same seed always gives the same frame.

import { FIELD, STEP, WORLD } from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './hud.js';
import { fenceAhead, ovenFlareIn, turkeyOnFlare } from './hazards.js';

const TITLE_SECONDS = 1.0;
const PLAY_SECONDS = 6.5;
const END_LIMIT_SECONDS = 90;
const HIDE_SECONDS = 1.2;
const ESCAPE_LIMIT_SECONDS = 20;

/** The one staged best score every shot shows, so the title and the end screen agree. */
const BEST_STAGED = 1250;

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
 * The barn scene holds the turkey still inside a hay bale while Farmer Jed
 * searches nearby, and the escaped scene runs the last stretch of the
 * kitchen for real, to the freedom gate. Every scene plays the real rules
 * forward from a fresh world for a fixed number of steps, so every frame
 * is what a short game really looks like and the same seed always gives
 * the same frame.
 */
export function stageShot(name, world) {
  world.reset();
  if (name !== 'play' && name !== 'kitchen' && name !== 'end' && name !== 'barn' && name !== 'escaped') {
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
    return { screen: SCREEN_TITLE, best: BEST_STAGED };
  }
  if (name === 'kitchen') {
    world.state.turkey.x = 6560;
    world.state.farmer.x = 6280;
    world.state.lives = 2;
    for (let i = 0; i < 2.5 / STEP; i += 1) {
      if (autopilotStep(world) & 4) break;
    }
    return { screen: SCREEN_PLAY, best: BEST_STAGED };
  }
  if (name === 'barn') {
    // The first bale of the barn stage: park the turkey dead centre in it
    // and hold still, so the hide rule engages and Farmer Jed, who can no
    // longer see it, drops into his search pace nearby.
    const bale = world.state.bales.find((b) => b.x >= WORLD.farmyardEnd && b.x < WORLD.barnEnd - 200);
    world.state.turkey.x = bale.x + bale.width / 2 - world.state.turkey.width / 2;
    world.state.turkey.y = FIELD.groundY - world.state.turkey.height;
    world.state.turkey.vy = 0;
    world.state.turkey.onGround = true;
    world.state.farmer.x = world.state.turkey.x - 340;
    world.state.farmer.y = FIELD.groundY - world.state.farmer.height;
    world.state.farmer.knifeTimer = 99;
    world.state.knives = [];
    for (let i = 0; i < HIDE_SECONDS / STEP; i += 1) {
      if (world.step(STEP, 0, false, true) & 4) break;
    }
    return { screen: SCREEN_PLAY, best: BEST_STAGED };
  }
  if (name === 'escaped') {
    // The last stretch of the kitchen, run for real: the autopilot jumps
    // fences and oven grates to the freedom gate, and the frame is the
    // ESCAPED end screen over the gate itself. Start far enough back that
    // the run genuinely collects a corn on the way, so the end panel's
    // stats are not all zeroes.
    world.state.turkey.x = WORLD.barnEnd + 2200;
    world.state.turkey.y = FIELD.groundY - world.state.turkey.height;
    world.state.turkey.vy = 0;
    world.state.turkey.onGround = true;
    world.state.farmer.x = world.state.turkey.x - 420;
    world.state.farmer.y = FIELD.groundY - world.state.farmer.height;
    world.state.farmer.knifeTimer = 99;
    world.state.lives = 3;
    world.state.knives = [];
    for (let i = 0; i < ESCAPE_LIMIT_SECONDS / STEP; i += 1) {
      if (autopilotStep(world) & 4) break;
    }
    return { screen: SCREEN_OVER, best: BEST_STAGED };
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
    return { screen: SCREEN_OVER, best: BEST_STAGED };
  }
  return { screen: SCREEN_PLAY, best: world.state.score };
}
