// The rules, with no drawing and no browser in them: the turkey, the farmer,
// the hazards and the score, stepped in fixed 1/60 s steps. step() returns
// what happened as bit flags so the caller can play sounds and messages
// without the world knowing about screens or speakers.

import { FIELD, LIVES, SCORE, TURKEY, WORLD } from './config.js';
import { createTurkey, updateTurkey } from './turkey.js';
import { createFarmer, farmerPressure, updateFarmer } from './farmer.js';
import {
  collectCorn, fenceBlocking, fenceCleared, nearestHay, overlaps,
  throwKnife, turkeyOnFlare, updateKnives, updateOvens,
} from './hazards.js';
import { buildStages, stageAt } from './stages.js';

export const EVENT_CORN = 1;
export const EVENT_HIT = 2;
export const EVENT_OVER = 4;
export const EVENT_SPOTTED = 8;
export const EVENT_JUMPED = 16;
export const EVENT_HIDDEN = 32;
export const EVENT_ESCAPED = 64;
export const EVENT_FENCE = 128;
export const EVENT_THROW = 256;
export const EVENT_STAGE = 512;

export const OUTCOME_CAUGHT = 'caught';
export const OUTCOME_ESCAPED = 'escaped';

export function createWorld(random) {
  const props = buildStages(random);
  const turkey = createTurkey();
  const farmer = createFarmer();
  const state = {
    turkey,
    farmer,
    fences: props.fences,
    bales: props.bales,
    corn: props.corn,
    ovens: props.ovens,
    knives: [],
    particles: [],
    score: 0,
    cornEaten: 0,
    fencesJumped: 0,
    lives: LIVES,
    elapsed: 0,
    distanceMetres: 0,
    bestDistance: 0,
    stage: 0,
    outcome: null,
    outcomeReason: '',
    message: '',
    messageTimer: 0,
    flashTimer: 0,
    startX: turkey.x,
  };

  function reset() {
    const fresh = buildStages(random);
    state.fences = fresh.fences;
    state.bales = fresh.bales;
    state.corn = fresh.corn;
    state.ovens = fresh.ovens;
    state.knives = [];
    state.particles = [];
    const t = state.turkey;
    t.x = 240; t.y = FIELD.groundY - TURKEY.height; t.vx = 0; t.vy = 0;
    t.facing = 1; t.onGround = true; t.hiding = false; t.hidden = false;
    t.invulnerable = 0; t.animTime = 0; t.moving = false;
    const f = state.farmer;
    f.x = -140; f.mood = 'chase'; f.knifeTimer = 2.2; f.searchTimer = 0; f.animTime = 0;
    state.score = 0; state.cornEaten = 0; state.fencesJumped = 0;
    state.lives = LIVES; state.elapsed = 0; state.distanceMetres = 0;
    state.stage = 0; state.outcome = null; state.outcomeReason = '';
    state.message = ''; state.messageTimer = 0; state.flashTimer = 0;
    state.startX = t.x;
  }

  function burst(x, y, colour, count) {
    for (let i = 0; i < count; i += 1) {
      state.particles.push({
        x, y,
        vx: (random() - 0.5) * 320,
        vy: -random() * 260 - 40,
        life: 0.5 + random() * 0.3,
        colour,
        size: 3 + random() * 5,
      });
    }
  }

  function updateParticles(dt) {
    for (let i = state.particles.length - 1; i >= 0; i -= 1) {
      const p = state.particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 700 * dt;
      if (p.life <= 0) state.particles.splice(i, 1);
    }
  }

  function say(text, seconds) {
    state.message = text;
    state.messageTimer = seconds;
  }

  function hurt(reason) {
    if (state.turkey.invulnerable > 0 || state.outcome) return 0;
    state.lives -= 1;
    state.turkey.invulnerable = TURKEY.invulnerable;
    state.flashTimer = 0.35;
    burst(state.turkey.x + 30, state.turkey.y + 30, '#ff5a3c', 16);
    if (state.lives <= 0) {
      state.outcome = OUTCOME_CAUGHT;
      state.outcomeReason = reason;
      return EVENT_HIT | EVENT_OVER;
    }
    say(reason, 1.4);
    return EVENT_HIT;
  }

  /**
   * One fixed step. `direction` is -1, 0 or 1; `jump` starts a jump;
   * `wantHide` holds the turkey down. The farmer, knives and ovens move
   * after the turkey, and every collision is checked in world order.
   */
  function step(dt, direction, jump, wantHide) {
    if (state.outcome) return 0;
    let events = 0;
    state.elapsed += dt;
    if (state.messageTimer > 0) state.messageTimer -= dt;
    if (state.flashTimer > 0) state.flashTimer -= dt;

    const bale = nearestHay(state.turkey, state.bales);
    const blocking = fenceBlocking(state.turkey, state.fences, direction);
    if (updateTurkey(state.turkey, dt, direction, jump, wantHide, bale !== null, blocking !== null)) {
      events |= EVENT_JUMPED;
    }
    if (state.turkey.hidden && !state.turkey.wasHiddenAnnounced) {
      state.turkey.wasHiddenAnnounced = true;
      events |= EVENT_HIDDEN;
      say('HIDDEN! Hold still…', 1.6);
    }
    if (!state.turkey.hidden) state.turkey.wasHiddenAnnounced = false;

    if (fenceCleared(state.turkey, state.fences)) {
      state.fencesJumped += 1;
      state.score += SCORE.fenceJump;
      events |= EVENT_FENCE;
    }

    const eaten = collectCorn(state.turkey, state.corn);
    if (eaten > 0) {
      state.cornEaten += eaten;
      state.score += SCORE.corn * eaten;
      burst(state.turkey.x + 30, state.turkey.y + 20, '#f2c94c', 8);
      events |= EVENT_CORN;
    }

    const flare = turkeyOnFlare(state.turkey, state.ovens);
    if (flare) events |= hurt('THE OVEN GOT YOU!');

    const farmerEvent = updateFarmer(state.farmer, state.turkey, dt, state.stage, true);
    state.farmer.y = FIELD.groundY - state.farmer.height;
    if (farmerEvent === 'spotted') {
      events |= EVENT_SPOTTED;
      say('SPOTTED!', 1.2);
      burst(state.farmer.x + 30, state.farmer.y, '#ff5a3c', 6);
    } else if (farmerEvent === 'throw') {
      throwKnife(state.knives, state.farmer, state.turkey);
      events |= EVENT_THROW;
    }

    updateKnives(state.knives, dt);
    updateOvens(state.ovens, dt);
    for (let i = state.knives.length - 1; i >= 0; i -= 1) {
      const knife = state.knives[i];
      if (overlaps(knife, state.turkey)) {
        state.knives.splice(i, 1);
        events |= hurt('A CARVING KNIFE GOT YOU!');
      }
    }

    // The farmer's grab: contact costs a life and flings the turkey ahead,
    // so a chase can still end in a narrow escape — until lives run out.
    const gap = state.turkey.x - state.farmer.x;
    if (gap < 52 && gap > -20 && state.turkey.invulnerable === 0 && !state.turkey.hidden) {
      const result = hurt('THE FARMER GRABBED YOU!');
      events |= result;
      if (!state.outcome) {
        state.turkey.x = Math.min(WORLD.length - 80, state.turkey.x + 170);
        say('NARROW ESCAPE!', 1.4);
        state.score += SCORE.hideEscape;
      }
    }

    state.distanceMetres = Math.max(0, Math.floor((state.turkey.x - state.startX) / 50));
    state.bestDistance = Math.max(state.bestDistance, state.distanceMetres);
    state.score = Math.max(state.score, state.distanceMetres * SCORE.perMetre
      + state.cornEaten * SCORE.corn + state.fencesJumped * SCORE.fenceJump);
    const newStage = stageAt(state.turkey.x);
    if (newStage !== state.stage) {
      state.stage = newStage;
      events |= EVENT_STAGE;
      say(newStage === 1 ? 'INTO THE BARN — STAY LOW!' : 'THE KITCHEN! THE OVEN IS LIT!', 2.2);
      burst(state.turkey.x + 30, state.turkey.y, '#ffc93b', 10);
    }

    if (state.turkey.x + state.turkey.width >= WORLD.goalX && !state.outcome) {
      state.outcome = OUTCOME_ESCAPED;
      state.outcomeReason = 'You outran Farmer Jed and reached the woods!';
      state.score += SCORE.escapeBonus;
      events |= EVENT_ESCAPED | EVENT_OVER;
      burst(state.turkey.x + 30, state.turkey.y + 20, '#7ddb6a', 24);
    }

    updateParticles(dt);
    return events;
  }

  reset();
  return {
    state,
    reset,
    step,
    farmerPressure() { return farmerPressure(state.farmer, state.turkey); },
  };
}
