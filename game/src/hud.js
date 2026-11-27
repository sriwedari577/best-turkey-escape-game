// The HUD, the menus and the end screens: everything drawn on top of the
// world. Buttons are laid out from the same rectangles the drawing uses,
// so a mouse click and the picture always agree.

import { FIELD, LIVES, PALETTE, STAGE_NAMES } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_HELP = 'help';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

/** Button rectangles for each screen, in logical 1280x720 coordinates. */
export function buttonsFor(screen) {
  const centre = FIELD.width / 2;
  if (screen === SCREEN_TITLE) {
    return [
      { id: 'start', label: '▶  START THE ESCAPE', x: centre - 250, y: 492, width: 500, height: 62 },
      { id: 'help', label: 'HOW TO PLAY', x: centre - 250, y: 566, width: 500, height: 46 },
    ];
  }
  if (screen === SCREEN_HELP) {
    return [
      { id: 'back', label: '←  BACK', x: centre - 180, y: 560, width: 360, height: 52 },
    ];
  }
  if (screen === SCREEN_PAUSED) {
    return [
      { id: 'resume', label: 'RESUME', x: centre - 250, y: 430, width: 500, height: 56 },
      { id: 'restart', label: 'RESTART RUN', x: centre - 250, y: 498, width: 500, height: 46 },
    ];
  }
  if (screen === SCREEN_OVER) {
    return [
      { id: 'restart', label: '↻  RUN AGAIN', x: centre - 250, y: 500, width: 500, height: 62 },
      { id: 'menu', label: 'TITLE SCREEN', x: centre - 250, y: 574, width: 500, height: 46 },
    ];
  }
  return [];
}

export function createHud(canvas) {
  const context = canvas.getContext('2d');
  const fonts = new Map();
  const scoreCache = { value: -1, text: '' };
  const distanceCache = { value: -1, text: '' };

  function text(value, x, y, size, color, align, weight) {
    const key = size + (weight || '');
    if (!fonts.has(key)) fonts.set(key, `${weight || ''} ${size}px "Trebuchet MS", "Segoe UI", sans-serif`);
    context.font = fonts.get(key);
    context.fillStyle = color;
    context.textAlign = align;
    context.textBaseline = 'alphabetic';
    context.fillText(value, x, y);
  }

  function cached(cache, prefix, value) {
    if (value !== cache.value) {
      cache.value = value;
      cache.text = prefix + value;
    }
    return cache.text;
  }

  function drawHearts(lives) {
    const size = 26;
    const gap = 8;
    const total = LIVES * (size + gap) - gap;
    let x = FIELD.width - 28 - total;
    const y = 22;
    text('LIVES', x - 14, y + 21, 22, PALETTE.text, 'right', 'bold');
    for (let i = 0; i < LIVES; i += 1) {
      const cx = x + i * (size + gap) + size / 2;
      const cy = y + size / 2;
      context.fillStyle = i < lives ? PALETTE.heart : PALETTE.heartEmpty;
      context.beginPath();
      context.moveTo(cx, cy + 9);
      context.bezierCurveTo(cx - 15, cy - 3, cx - 8, cy - 13, cx, cy - 5);
      context.bezierCurveTo(cx + 8, cy - 13, cx + 15, cy - 3, cx, cy + 9);
      context.fill();
    }
  }

  function drawFarmerBar(pressure) {
    const width = 300;
    const x = FIELD.width - 28 - width;
    const y = 62;
    text('FARMER JED', x - 12, y + 16, 19, PALETTE.text, 'right', 'bold');
    context.fillStyle = 'rgba(0, 0, 0, 0.45)';
    context.fillRect(x, y, width, 16);
    const fill = Math.round(width * pressure);
    context.fillStyle = pressure > 0.75 ? PALETTE.danger : pressure > 0.45 ? '#f2a93b' : PALETTE.good;
    context.fillRect(x, y, fill, 16);
    context.strokeStyle = 'rgba(255, 243, 221, 0.7)';
    context.lineWidth = 2;
    context.strokeRect(x, y, width, 16);
    if (pressure > 0.75) {
      text('HE IS RIGHT BEHIND YOU!', x + width / 2, y + 38, 17, PALETTE.danger, 'center', 'bold');
    }
  }

  /** The in-play HUD: score, distance, stage, corn, lives and farmer pressure. */
  function drawHud(state, pressure, muted) {
    context.fillStyle = 'rgba(20, 11, 4, 0.55)';
    context.fillRect(0, 0, FIELD.width, 96);
    text(cached(scoreCache, 'SCORE ', state.score), 26, 40, 30, PALETTE.text, 'left', 'bold');
    text(cached(distanceCache, '', state.distanceMetres) + ' m', FIELD.width / 2 - 130, 40, 30, PALETTE.text, 'left', 'bold');
    text('CORN ' + state.cornEaten, FIELD.width / 2 + 60, 40, 30, PALETTE.corn, 'left', 'bold');
    text(STAGE_NAMES[state.stage], FIELD.width / 2, 76, 19, PALETTE.muted, 'center', 'bold');
    text(muted ? 'SOUND OFF (M)' : 'SOUND ON (M)', 26, 76, 18, PALETTE.muted, 'left');
    drawHearts(state.lives);
    drawFarmerBar(pressure);

    if (state.messageTimer > 0) {
      const alpha = Math.min(1, state.messageTimer * 2);
      context.globalAlpha = alpha;
      context.fillStyle = 'rgba(20, 11, 4, 0.7)';
      const messageWidth = 560;
      context.fillRect(FIELD.width / 2 - messageWidth / 2, 118, messageWidth, 44);
      text(state.message, FIELD.width / 2, 148, 26, PALETTE.text, 'center', 'bold');
      context.globalAlpha = 1;
    }
    if (state.flashTimer > 0) {
      context.globalAlpha = Math.min(0.45, state.flashTimer);
      context.fillStyle = PALETTE.danger;
      context.fillRect(0, 0, FIELD.width, FIELD.height);
      context.globalAlpha = 1;
    }
  }

  /** A small turkey drawn from the game's own shapes: tail fan, body,
   *  head, beak and wattle — used beside the title instead of an emoji. */
  function drawTitleTurkey(cx, cy, facing, scale) {
    context.save();
    context.translate(cx, cy);
    context.scale(scale, scale);
    for (let i = 0; i < 5; i += 1) {
      const angle = (i - 2) * 0.32;
      context.fillStyle = PALETTE.turkeyTail[i % 3];
      context.save();
      context.translate(-facing * 12, 8);
      context.rotate(-facing * angle);
      context.beginPath();
      context.ellipse(-facing * 24, 0, 28, 10, 0, 0, Math.PI * 2);
      context.fill();
      context.restore();
    }
    context.fillStyle = PALETTE.turkeyBody;
    context.beginPath();
    context.ellipse(0, 10, 27, 24, 0, 0, Math.PI * 2);
    context.fill();
    const headX = facing * 22;
    context.fillStyle = PALETTE.turkeyHead;
    context.fillRect(headX - 8, -26, 16, 24);
    context.beginPath();
    context.arc(headX, -22, 12, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = PALETTE.turkeyBeak;
    context.beginPath();
    context.moveTo(headX + facing * 9, -24);
    context.lineTo(headX + facing * 23, -19);
    context.lineTo(headX + facing * 9, -14);
    context.closePath();
    context.fill();
    context.fillStyle = PALETTE.turkeyWattle;
    context.beginPath();
    context.ellipse(headX + facing * 4, -8, 4, 9, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#1c1006';
    context.beginPath();
    context.arc(headX + facing * 5, -25, 3, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  function drawButton(button, hover) {
    context.fillStyle = hover ? '#e89b3c' : '#c96a1e';
    context.fillRect(button.x, button.y, button.width, button.height);
    context.strokeStyle = '#fff3dd';
    context.lineWidth = 3;
    context.strokeRect(button.x, button.y, button.width, button.height);
    text(button.label, button.x + button.width / 2, button.y + button.height / 2 + 8, 24, '#fff3dd', 'center', 'bold');
  }

  function drawPanel(title, lines, prompt, screen, pointer) {
    const width = 760;
    const panelButtons = buttonsFor(screen);
    let height = 250 + lines.length * 34;
    const top = (FIELD.height - height) / 2 - 20;
    if (panelButtons.length > 0) {
      const buttonBottom = Math.max(...panelButtons.map((b) => b.y + b.height));
      height = Math.max(height, buttonBottom + 28 - top);
    }
    const x = (FIELD.width - width) / 2;
    const y = top;
    context.fillStyle = PALETTE.panel;
    context.fillRect(x, y, width, height);
    context.strokeStyle = '#c96a1e';
    context.lineWidth = 4;
    context.strokeRect(x, y, width, height);
    text(title, FIELD.width / 2, y + 72, 52, PALETTE.text, 'center', 'bold');
    for (let i = 0; i < lines.length; i += 1) {
      text(lines[i], FIELD.width / 2, y + 122 + i * 34, 23, PALETTE.muted, 'center');
    }
    if (prompt) {
      const firstButtonTop = panelButtons.length > 0 ? Math.min(...panelButtons.map((b) => b.y)) : 0;
      const promptY = panelButtons.length > 0 ? firstButtonTop - 16 : y + height - 118;
      text(prompt, FIELD.width / 2, promptY, 22, PALETTE.corn, 'center');
    }
    for (const button of buttonsFor(screen)) {
      const hover = pointer && pointer.x >= button.x && pointer.x <= button.x + button.width
        && pointer.y >= button.y && pointer.y <= button.y + button.height;
      drawButton(button, hover);
    }
  }

  /** Paint the overlay for the current screen, over the world already drawn. */
  function draw(state, screen, best, pressure, muted, pointer, time) {
    if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED) {
      drawHud(state, pressure, muted);
      if (screen === SCREEN_PAUSED) {
        context.fillStyle = 'rgba(20, 11, 4, 0.55)';
        context.fillRect(0, 0, FIELD.width, FIELD.height);
        drawPanel('PAUSED', ['Farmer Jed waits for no turkey…', 'well, just this once he does.'],
          'Press P or click RESUME', screen, pointer);
      } else if (state.elapsed < 6) {
        context.fillStyle = 'rgba(20, 11, 4, 0.65)';
        context.fillRect(0, FIELD.height - 46, FIELD.width, 46);
        text('← → / A D move  ·  SPACE jump  ·  ↓ hide in hay  ·  Click to jump  ·  P pause',
          FIELD.width / 2, FIELD.height - 16, 21, PALETTE.text, 'center', 'bold');
      }
      return;
    }
    if (screen === SCREEN_TITLE) {
      drawPanel('GOBBLE DASH', [
        'Thanksgiving is coming. Farmer Jed has the oven lit',
        'and his carving knife sharpened. You are the dinner.',
        'Run from the farmyard, through the barn, past the',
        'kitchen — and out the gate to freedom!',
        'Move ← → or A D · Jump SPACE · Hide ↓ in hay bales',
        'Grab corn · Jump fences · Dodge knives · Mind the oven',
      ], 'Best score: ' + best, screen, pointer);
      // Drawn turkeys flanking the title, clear of the title text.
      context.font = 'bold 52px "Trebuchet MS", "Segoe UI", sans-serif';
      const titleWidth = context.measureText('GOBBLE DASH').width;
      const panelTop = (FIELD.height - (250 + 6 * 34)) / 2 - 20;
      drawTitleTurkey(FIELD.width / 2 - titleWidth / 2 - 58, panelTop + 58, 1, 0.95);
      drawTitleTurkey(FIELD.width / 2 + titleWidth / 2 + 58, panelTop + 58, -1, 0.95);
      return;
    }
    if (screen === SCREEN_HELP) {
      drawPanel('HOW TO PLAY', [
        'You are Tom the turkey. Farmer Jed chases you all',
        'the way from the farmyard to the kitchen.',
        'RUN with ← → or A D, or hold the mouse to steer.',
        'JUMP fences and oven grates with SPACE, W, ↑ or click.',
        'HIDE: stand by a hay bale and hold ↓ or S. Stay still!',
        'Jed searches, then gives up — move and he spots you.',
        'CORN is 25 points. A jumped fence is 10. Reach the',
        'FREEDOM gate at the end of the kitchen to escape.',
        'Three hits — knife, oven or the farmer\'s grab — and',
        'you are Thanksgiving dinner. Good luck, Tom!',
      ], '', screen, pointer);
      return;
    }
    if (screen === SCREEN_OVER) {
      const escaped = state.outcome === 'escaped';
      const title = escaped ? 'ESCAPED!' : 'CAUGHT FOR DINNER';
      drawPanel(title, [
        state.outcomeReason,
        'Score ' + state.score + '   ·   Distance ' + state.distanceMetres + ' m   ·   Corn ' + state.cornEaten,
        'Fences jumped ' + state.fencesJumped + '   ·   Best score ' + Math.max(best, state.score),
        escaped ? 'Tom lives to gobble another day.' : 'Farmer Jed is already sharpening the knife…',
      ], 'Press Space or click RUN AGAIN', screen, pointer);
    }
  }

  return { draw, drawHud };
}
