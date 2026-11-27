// Every tuning number and colour for Gobble Dash: one turkey, one farmer, three
// stages from the farmyard to the kitchen. The playfield is a fixed 1280x720
// logical area; the renderer scales it to the window, so no rule here depends
// on the screen size. Distances are in world pixels; 50 pixels count as 1 metre.

export const FIELD = { width: 1280, height: 720, groundY: 612 };

/** The simulation's fixed step, in seconds: 60 updates a second at any display rate. */
export const STEP = 1 / 60;

export const TURKEY = {
  width: 62,
  height: 74,
  runSpeed: 330,
  sneakSpeed: 150,
  jumpSpeed: 760,
  gravity: 2100,
  invulnerable: 2.0,
  hideRadius: 74,
};

export const FARMER = {
  width: 66,
  height: 96,
  chaseSpeed: 282,
  searchSpeed: 120,
  cornerSpeed: 314,
  catchupBonus: 48,
  knifeInterval: 3.1,
  knifeIntervalKitchen: 2.3,
  grabReach: 46,
};

export const LIVES = 3;

/** World length and stage boundaries, in pixels. The freedom gate stands at the end. */
export const WORLD = { length: 9800, farmyardEnd: 3200, barnEnd: 6400, goalX: 9560 };

export const STAGE_NAMES = ['1 · FARMYARD', '2 · THE BARN', '3 · THE KITCHEN'];

export const SCORE = { perMetre: 2, corn: 25, fenceJump: 10, hideEscape: 15, escapeBonus: 500 };

export const OVEN = { width: 130, flareSeconds: 1.5, calmSeconds: 1.8, warningSeconds: 0.8, damageHeight: 90 };

export const KNIFE = { width: 34, height: 15, speed: 520, gravity: 900, damage: 1 };

export const PALETTE = {
  backdrop: '#241608',
  skyFarm: '#f2a65a',
  skyFarmTop: '#f7c873',
  skyBarnTop: '#4a2c1a',
  skyBarn: '#6b4526',
  skyKitchenTop: '#7a2d1a',
  skyKitchen: '#a34a24',
  groundFarm: '#8a5a2b',
  groundFarmTop: '#b57a35',
  groundBarn: '#4a2f1c',
  groundBarnTop: '#6b4a28',
  groundKitchen: '#5e3a2e',
  groundKitchenTop: '#7d5240',
  turkeyBody: '#7a4a26',
  turkeyDark: '#5e3618',
  turkeyTail: ['#c96a1e', '#e89b3c', '#f2c94c'],
  turkeyHead: '#e8b48a',
  turkeyWattle: '#d93b2b',
  turkeyBeak: '#f2a93b',
  turkeyLeg: '#e8a33c',
  farmerHat: '#c9a227',
  farmerShirt: '#3f6fb5',
  farmerOveralls: '#2f4a7a',
  farmerSkin: '#e8b48a',
  farmerBeard: '#e8e0d0',
  knifeBlade: '#dfe5ec',
  knifeHandle: '#4a2f1c',
  corn: '#f2c94c',
  cornHusk: '#5a8a3c',
  hay: '#e0b84c',
  hayDark: '#b8922f',
  fence: '#6b4423',
  ovenBody: '#3a3f4a',
  ovenGlow: '#ff6a1a',
  ovenFlame: '#ffc93b',
  panel: 'rgba(28, 16, 6, 0.92)',
  text: '#fff3dd',
  muted: '#e8c9a0',
  danger: '#ff5a3c',
  good: '#7ddb6a',
  heart: '#ff5a6a',
  heartEmpty: '#5a3a2e',
};

export const FONT = '"Trebuchet MS", "Segoe UI", system-ui, sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'gobble-dash.best';
