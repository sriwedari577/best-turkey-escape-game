// Boot and the one loop: input is read once per frame, the world advances
// in fixed 1/60 s steps (several in a slow frame, none in a fast one), and
// the renderer and HUD paint what is there. The game moves between five
// screens: title, help, play, paused and game over.
//
// ?seed=N fixes the farm's layout. ?shot=title|play|kitchen|end (with
// &seed=N) stages that scene instead of running the loop, paints it twice
// and sets window.__shotReady for a screenshot.
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createAudio } from './audio.js';
import { createWorld, EVENT_CORN, EVENT_FENCE, EVENT_HIDDEN, EVENT_HIT, EVENT_JUMPED, EVENT_OVER, EVENT_SPOTTED, EVENT_STAGE } from './world.js';
import { ACTION_CONFIRM, ACTION_JUMP, ACTION_MUTE, ACTION_PAUSE, createInput } from './input.js';
import { createRenderer } from './render.js';
import { SCREEN_HELP, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, buttonsFor, createHud } from './hud.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall is dropped. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const hud = createHud(canvas);
const audio = createAudio();
let currentButtons = [];
let pointer = { x: -1, y: -1 };

const input = createInput(canvas, (x, y) => {
  for (const button of currentButtons) {
    if (x >= button.x && x <= button.x + button.width && y >= button.y && y <= button.y + button.height) return button.id;
  }
  return null;
});

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, performance.now() / 1000);
    currentButtons = buttonsFor(scene.screen);
    hud.draw(world.state, scene.screen, scene.best, world.farmerPressure(), audio.isMuted(), pointer, performance.now() / 1000);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();
  let muted = false;
  let time = 0;

  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    audio.ensureAudio();
    audio.gobble();
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    announce('Playing. Three lives. Run for the freedom gate!');
  }

  function endGame() {
    screen = SCREEN_OVER;
    if (world.state.score > best) {
      best = world.state.score;
      saveBest(best);
    }
    if (world.state.outcome === 'escaped') audio.escapeFanfare();
    else audio.caughtSound();
    announce(world.state.outcome === 'escaped'
      ? `Escaped! Score ${world.state.score}. Best ${best}.`
      : `Caught for dinner. Score ${world.state.score}. Best ${best}.`);
  }

  function applyButton(id) {
    if (id === 'start' || id === 'restart') startGame();
    else if (id === 'help') screen = SCREEN_HELP;
    else if (id === 'back') screen = SCREEN_TITLE;
    else if (id === 'resume') screen = SCREEN_PLAY;
    else if (id === 'menu') screen = SCREEN_TITLE;
  }

  /** React to one frame's one-shot actions; returns whether jump was pressed. */
  function handleActions(actions) {
    if (actions & ACTION_MUTE) {
      muted = audio.toggleMute();
      announce(muted ? 'Sound off.' : 'Sound on.');
    }
    const clicked = input.takeClickedButton();
    if (clicked) {
      audio.ensureAudio();
      applyButton(clicked);
      return false;
    }
    if (actions & ACTION_CONFIRM) {
      if (screen === SCREEN_TITLE || screen === SCREEN_OVER) startGame();
      else if (screen === SCREEN_HELP) screen = SCREEN_TITLE;
      else if (screen === SCREEN_PAUSED) screen = SCREEN_PLAY;
    }
    if (actions & ACTION_PAUSE) {
      if (screen === SCREEN_PLAY) {
        screen = SCREEN_PAUSED;
        announce('Paused.');
      } else if (screen === SCREEN_PAUSED) {
        screen = SCREEN_PLAY;
        announce('Playing.');
      }
    }
    if (actions & ACTION_JUMP) {
      if (screen === SCREEN_TITLE || screen === SCREEN_OVER) {
        startGame();
        return false;
      }
      return screen === SCREEN_PLAY;
    }
    return false;
  }

  function playSounds(events) {
    if (events & EVENT_JUMPED) audio.jumpSound();
    if (events & EVENT_CORN) audio.pickupCorn();
    if (events & EVENT_HIT) audio.hitSound();
    if (events & EVENT_SPOTTED) audio.spottedSound();
    if (events & EVENT_HIDDEN) audio.hideSound();
    if (events & EVENT_FENCE) announce('Fence cleared!');
    if (events & EVENT_STAGE) audio.gobble();
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    time += dt;
    pointer = input.pointerPosition();

    // One read of the one-shot actions per frame: menus and pause take
    // theirs, and a jump press survives into the step loop below.
    const jumpPressed = handleActions(input.takeActions());

    if (screen === SCREEN_TITLE || screen === SCREEN_HELP) {
      world.step(STEP, 0, false, false);
      if (world.state.outcome) world.reset();
    } else if (screen === SCREEN_PLAY) {
      accumulator += dt;
      let jumpQueued = jumpPressed;
      while (accumulator >= STEP && screen === SCREEN_PLAY) {
        const direction = input.direction(451);
        const events = world.step(STEP, direction, jumpQueued, input.isHiding());
        jumpQueued = false;
        accumulator -= STEP;
        playSounds(events);
        if (events & EVENT_OVER) {
          endGame();
          break;
        }
      }
    } else {
      accumulator = 0;
    }
    audio.tickTune(dt, screen === SCREEN_PLAY);
    currentButtons = buttonsFor(screen);
    renderer.draw(world.state, time);
    hud.draw(world.state, screen, best, world.farmerPressure(), muted, pointer, time);
  }

  // Leaving the tab pauses a running game rather than letting Jed catch Tom unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Gobble Dash. Press Space or click Start to play.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
