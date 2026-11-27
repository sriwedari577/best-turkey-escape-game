// Keyboard and mouse input. Held keys and a held pointer steer the turkey;
// one-shot presses (start, restart, jump, pause, mute) are queued as bit
// flags and taken once by the loop, so a press between frames is never lost
// and never counted twice. Clicking a menu button is reported as a button
// id instead, so the menus work with the mouse alone.

export const ACTION_CONFIRM = 1;
export const ACTION_JUMP = 2;
export const ACTION_PAUSE = 4;
export const ACTION_MUTE = 8;
export const ACTION_HIDE = 16;

const LEFT = new Set(['ArrowLeft', 'KeyA']);
const RIGHT = new Set(['ArrowRight', 'KeyD']);
const JUMP = new Set(['Space', 'ArrowUp', 'KeyW']);
const HIDE = new Set(['ArrowDown', 'KeyS']);
const CONFIRM = new Set(['Enter']);
const PAUSE = new Set(['KeyP', 'Escape']);

export function createInput(canvas, buttonAt) {
  let left = false;
  let right = false;
  let hiding = false;
  let actions = 0;
  let pointerHeld = false;
  let pointerX = 0;
  let pointerY = 0;
  let clickedButton = null;

  window.addEventListener('keydown', (event) => {
    if (LEFT.has(event.code)) left = true;
    else if (RIGHT.has(event.code)) right = true;
    else if (JUMP.has(event.code)) {
      if (!event.repeat) actions |= ACTION_JUMP;
    } else if (HIDE.has(event.code)) hiding = true;
    else if (CONFIRM.has(event.code)) {
      if (!event.repeat) actions |= ACTION_CONFIRM;
    } else if (PAUSE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_PAUSE;
    } else if (event.code === 'KeyM') {
      if (!event.repeat) actions |= ACTION_MUTE;
    } else return;
    event.preventDefault();
  });
  window.addEventListener('keyup', (event) => {
    if (LEFT.has(event.code)) left = false;
    else if (RIGHT.has(event.code)) right = false;
    else if (HIDE.has(event.code)) hiding = false;
  });
  // A key released while the tab is hidden never sends keyup: let go on blur.
  window.addEventListener('blur', () => {
    left = false;
    right = false;
    hiding = false;
    pointerHeld = false;
  });

  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * 1280,
      y: ((event.clientY - rect.top) / rect.height) * 720,
    };
  }

  canvas.addEventListener('pointerdown', (event) => {
    const point = canvasPoint(event);
    const button = buttonAt(point.x, point.y);
    if (button) {
      clickedButton = button;
      return;
    }
    pointerHeld = true;
    pointerX = point.x;
    pointerY = point.y;
    if (!event.repeat) actions |= ACTION_JUMP;
  });
  canvas.addEventListener('pointermove', (event) => {
    const point = canvasPoint(event);
    pointerX = point.x;
    pointerY = point.y;
  });
  window.addEventListener('pointerup', () => {
    pointerHeld = false;
  });

  return {
    /** -1 for left, 1 for right, 0 for neither or both; pointer steers too. */
    direction(turkeyScreenX) {
      const keys = (right ? 1 : 0) - (left ? 1 : 0);
      if (keys !== 0) return keys;
      if (pointerHeld) {
        if (pointerX > turkeyScreenX + 40) return 1;
        if (pointerX < turkeyScreenX - 40) return -1;
      }
      return 0;
    },
    isHiding() { return hiding; },
    isPointerHeld() { return pointerHeld; },
    pointerPosition() { return { x: pointerX, y: pointerY }; },
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    /** The id of a menu button clicked since the last call, or null. */
    takeClickedButton() {
      const button = clickedButton;
      clickedButton = null;
      return button;
    },
    /** True while the pointer is down over the lower half: a mouse-only jump hold. */
    pointerJumpHeld() { return pointerHeld && pointerY > 360; },
  };
}
