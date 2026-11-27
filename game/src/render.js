// Drawing only: the world's state in, pixels out. The camera follows the
// turkey through one scrolling 1280x720 view; each stage paints its own
// parallax backdrop (farmyard fences and sun, barn beams and haylofts,
// kitchen tiles and a glowing oven), then the props, the farmer, the
// turkey, and the particle bursts. All art is flat canvas shapes drawn
// here — no images, no fonts loaded from anywhere.

import { FIELD, PALETTE, WORLD } from './config.js';
import { stageAt } from './stages.js';
import { ovenIsFlaring, ovenIsWarning } from './hazards.js';
import { MOOD_SEARCH } from './farmer.js';

export function cameraXFor(turkeyX) {
  return Math.max(0, Math.min(WORLD.length - FIELD.width, turkeyX - 420));
}

export function createRenderer(canvas) {
  const context = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(window.innerWidth * ratio);
    const height = Math.round(window.innerHeight * ratio);
    canvas.width = width;
    canvas.height = height;
    view.scale = Math.min(width / FIELD.width, height / FIELD.height);
    view.x = (width - FIELD.width * view.scale) / 2;
    view.y = (height - FIELD.height * view.scale) / 2;
  }

  function skyFor(stage) {
    if (stage === 0) return [PALETTE.skyFarmTop, PALETTE.skyFarm];
    if (stage === 1) return [PALETTE.skyBarnTop, PALETTE.skyBarn];
    return [PALETTE.skyKitchenTop, PALETTE.skyKitchen];
  }

  function groundFor(stage) {
    if (stage === 0) return [PALETTE.groundFarmTop, PALETTE.groundFarm];
    if (stage === 1) return [PALETTE.groundBarnTop, PALETTE.groundBarn];
    return [PALETTE.groundKitchenTop, PALETTE.groundKitchen];
  }

  /** The backdrop for one stage, drawn in screen space behind the world. */
  function drawBackdrop(stage, cameraX, time) {
    const [top, bottom] = skyFor(stage);
    const gradient = context.createLinearGradient(0, 0, 0, FIELD.groundY);
    gradient.addColorStop(0, top);
    gradient.addColorStop(1, bottom);
    context.fillStyle = gradient;
    context.fillRect(0, 0, FIELD.width, FIELD.groundY);

    if (stage === 0) {
      // Low autumn sun and drifting clouds over the farmyard.
      context.fillStyle = '#fff0b8';
      context.beginPath();
      context.arc(1050 - (cameraX * 0.05) % 200, 110, 52, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = 'rgba(255, 243, 221, 0.85)';
      for (let i = 0; i < 4; i += 1) {
        const cx = ((i * 340 - cameraX * 0.12) % 1500 + 1500) % 1500 - 100;
        context.beginPath();
        context.ellipse(cx, 90 + i * 38, 90, 22, 0, 0, Math.PI * 2);
        context.fill();
      }
      // Barn silhouette on the horizon.
      context.fillStyle = '#7a3b1e';
      context.fillRect(180 - cameraX * 0.2, 360, 260, 160);
      context.beginPath();
      context.moveTo(150 - cameraX * 0.2, 362);
      context.lineTo(310 - cameraX * 0.2, 280);
      context.lineTo(470 - cameraX * 0.2, 362);
      context.closePath();
      context.fill();
      context.fillStyle = '#5e2c14';
      context.fillRect(300 - cameraX * 0.2, 420, 44, 100);
    } else if (stage === 1) {
      // Barn interior: plank walls, beams, a hayloft, barrels and crates,
      // a leaning pitchfork, and dusty light from the door.
      context.fillStyle = '#2a1a0e';
      for (let i = 0; i < 7; i += 1) {
        const bx = i * 200 - (cameraX * 0.3) % 200;
        context.fillRect(bx, 0, 26, FIELD.groundY);
      }
      // Horizontal wall planks.
      context.fillStyle = 'rgba(0, 0, 0, 0.28)';
      for (let row = 0; row < 5; row += 1) {
        context.fillRect(0, 40 + row * 96, FIELD.width, 4);
      }
      context.fillStyle = '#4a2f1c';
      context.fillRect(0, 150, FIELD.width, 22);
      // Barrels and crates stacked against the back wall (parallax).
      for (let i = 0; i < 4; i += 1) {
        const bx = ((i * 430 - cameraX * 0.45) % 1720 + 1720) % 1720 - 120;
        context.fillStyle = '#7a4a22';
        context.fillRect(bx, 452, 74, 68);
        context.fillStyle = '#5e3618';
        context.fillRect(bx, 474, 74, 6);
        context.fillRect(bx, 496, 74, 6);
        context.fillStyle = '#8a5a2b';
        context.fillRect(bx + 96, 478, 62, 42);
        context.strokeStyle = '#5e3618';
        context.lineWidth = 4;
        context.strokeRect(bx + 96, 478, 62, 42);
        context.beginPath();
        context.moveTo(bx + 96, 478);
        context.lineTo(bx + 158, 520);
        context.moveTo(bx + 158, 478);
        context.lineTo(bx + 96, 520);
        context.stroke();
      }
      // A pitchfork leaning on the wall, and a rope with a pulley.
      const forkX = 980 - (cameraX * 0.45) % 1290;
      context.strokeStyle = '#8a6d3f';
      context.lineWidth = 5;
      context.beginPath();
      context.moveTo(forkX + 16, FIELD.groundY);
      context.lineTo(forkX + 34, 330);
      context.stroke();
      context.strokeStyle = '#dfe5ec';
      context.lineWidth = 4;
      for (let t = -1; t <= 1; t += 1) {
        context.beginPath();
        context.moveTo(forkX + 34 + t * 12, 330);
        context.lineTo(forkX + 34 + t * 16, 296);
        context.stroke();
      }
      context.strokeStyle = '#3a2417';
      context.lineWidth = 3;
      context.beginPath();
      context.moveTo(420 - (cameraX * 0.3) % 900, 0);
      context.lineTo(420 - (cameraX * 0.3) % 900, 96);
      context.stroke();
      context.fillStyle = '#c9a227';
      context.beginPath();
      context.arc(420 - (cameraX * 0.3) % 900, 108, 13, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = 'rgba(255, 220, 140, 0.16)';
      context.beginPath();
      context.moveTo(240, 0);
      context.lineTo(520, 0);
      context.lineTo(760, FIELD.groundY);
      context.lineTo(380, FIELD.groundY);
      context.closePath();
      context.fill();
      context.fillStyle = '#c9a227';
      for (let i = 0; i < 6; i += 1) {
        const hx = ((i * 260 - cameraX * 0.45) % 1560 + 1560) % 1560 - 90;
        context.beginPath();
        context.ellipse(hx + 60, 150, 78, 30, 0, Math.PI, 0);
        context.fill();
      }
      context.fillStyle = '#8a6d1f';
      for (let i = 0; i < 6; i += 1) {
        const hx = ((i * 260 - cameraX * 0.45) % 1560 + 1560) % 1560 - 90;
        context.fillRect(hx + 10, 146, 100, 5);
      }
      // Hanging lanterns: a cord, a warm glow, and a swaying lamp.
      for (let i = 0; i < 4; i += 1) {
        const lx = i * 330 - (cameraX * 0.3) % 330 + 60;
        const sway = Math.sin(time + i) * 4;
        context.fillStyle = 'rgba(255, 201, 59, 0.18)';
        context.beginPath();
        context.arc(lx + 1, 84 + sway, 34, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = '#2a1a0e';
        context.fillRect(lx, 0, 3, 60 + sway);
        context.fillStyle = '#ffc93b';
        context.beginPath();
        context.arc(lx + 1, 78 + sway, 12, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = '#7a5a10';
        context.fillRect(lx - 6, 64 + sway, 14, 6);
      }
    } else {
      // Kitchen: checkered tiles, hanging pots, and the big oven's glow.
      context.fillStyle = '#8a4a30';
      for (let row = 0; row < 6; row += 1) {
        for (let col = 0; col < 12; col += 1) {
          if ((row + col) % 2 === 0) continue;
          context.fillStyle = 'rgba(255, 220, 180, 0.10)';
          context.fillRect(col * 112 - (cameraX * 0.15) % 112, row * 88, 112, 88);
        }
      }
      context.fillStyle = '#3a2417';
      context.fillRect(0, 120, FIELD.width, 18);
      context.fillStyle = '#5e3a2e';
      for (let i = 0; i < 5; i += 1) {
        const px = ((i * 280 - cameraX * 0.25) % 1500 + 1500) % 1500 - 60;
        context.beginPath();
        context.arc(px, 190, 34, Math.PI, 0);
        context.fill();
        context.fillRect(px - 4, 150, 8, 12);
      }
      context.fillStyle = '#c9ced6';
      context.fillRect(80 - (cameraX * 0.1) % 90, 250, 200, 130);
      context.fillStyle = '#7a2d1a';
      context.fillRect(96 - (cameraX * 0.1) % 90, 266, 168, 98);
      context.fillStyle = '#c9ced6';
      context.fillRect(174 - (cameraX * 0.1) % 90, 266, 10, 98);
      context.fillRect(96 - (cameraX * 0.1) % 90, 310, 168, 10);
    }
  }

  /** One fence: a discrete, jumpable obstacle with posts, rails, a
   *  diagonal brace and a pointed cap, drawn wider than its collision
   *  box so it reads as a fence at a glance. */
  function drawFence(fence, cameraX) {
    const x = fence.x - cameraX;
    const top = FIELD.groundY - fence.height;
    // Soft shadow at the base.
    context.fillStyle = 'rgba(0, 0, 0, 0.25)';
    context.beginPath();
    context.ellipse(x + fence.width / 2, FIELD.groundY + 4, fence.width / 2 + 22, 7, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = PALETTE.fence;
    // Posts with pointed caps, set outside the collision box.
    for (const px of [x - 14, x + fence.width + 4]) {
      context.fillRect(px, top - 6, 10, fence.height + 6);
      context.beginPath();
      context.moveTo(px - 2, top - 6);
      context.lineTo(px + 5, top - 20);
      context.lineTo(px + 12, top - 6);
      context.closePath();
      context.fill();
    }
    // Rails spanning the whole visual width, with a lighter top edge.
    context.fillRect(x - 18, top + 10, fence.width + 36, 10);
    context.fillRect(x - 18, top + 38, fence.width + 36, 10);
    context.fillStyle = 'rgba(255, 243, 221, 0.35)';
    context.fillRect(x - 18, top + 10, fence.width + 36, 3);
    // Diagonal brace and a red flag on the left post: jump here.
    context.fillStyle = PALETTE.fence;
    context.save();
    context.translate(x + fence.width / 2, top + 29);
    context.rotate(0.55);
    context.fillRect(-26, -5, 52, 9);
    context.restore();
    context.fillStyle = '#d93b2b';
    context.beginPath();
    context.moveTo(x - 4, top - 20);
    context.lineTo(x + 18, top - 14);
    context.lineTo(x - 4, top - 8);
    context.closePath();
    context.fill();
  }

  /** A hay bale: a rounded bale with twine bands, straw strokes and a
   *  shaded base, so it reads as a bale rather than a flat disc. */
  function drawBale(bale, cameraX, hiding) {
    const x = bale.x - cameraX;
    const y = FIELD.groundY - bale.height;
    const cx = x + bale.width / 2;
    const cy = y + bale.height / 2;
    context.fillStyle = 'rgba(0, 0, 0, 0.25)';
    context.beginPath();
    context.ellipse(cx, FIELD.groundY + 4, bale.width / 2 + 6, 7, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = hiding ? PALETTE.hayDark : PALETTE.hay;
    context.beginPath();
    context.ellipse(cx, cy, bale.width / 2, bale.height / 2, 0, 0, Math.PI * 2);
    context.fill();
    // Shaded lower half and a bright top arc.
    context.fillStyle = 'rgba(122, 74, 22, 0.30)';
    context.beginPath();
    context.ellipse(cx, cy + 12, bale.width / 2 - 4, bale.height / 2 - 14, 0, 0, Math.PI);
    context.fill();
    context.strokeStyle = 'rgba(255, 243, 221, 0.55)';
    context.lineWidth = 4;
    context.beginPath();
    context.ellipse(cx, cy - 6, bale.width / 2 - 14, bale.height / 2 - 16, 0, Math.PI * 1.15, Math.PI * 1.85);
    context.stroke();
    // Twine bands.
    context.strokeStyle = PALETTE.hayDark;
    context.lineWidth = 4;
    for (const offset of [-22, 22]) {
      context.beginPath();
      context.ellipse(cx + offset, cy, 10, bale.height / 2 - 4, 0, 0, Math.PI * 2);
      context.stroke();
    }
    // Straw strokes: short deterministic dashes across the bale.
    context.strokeStyle = '#a87f2e';
    context.lineWidth = 2;
    for (let i = 0; i < 14; i += 1) {
      const h = ((bale.x * 31 + i * 2654435761) >>> 0) / 4294967296;
      const sx = x + 12 + h * (bale.width - 24);
      const sy = y + 14 + ((i * 37) % (bale.height - 28));
      context.beginPath();
      context.moveTo(sx, sy);
      context.lineTo(sx + 10 - h * 20, sy + 4);
      context.stroke();
    }
    // A straw tuft on top.
    context.strokeStyle = '#f2c94c';
    context.lineWidth = 3;
    for (let i = -2; i <= 2; i += 1) {
      context.beginPath();
      context.moveTo(cx + i * 7, y + 6);
      context.lineTo(cx + i * 10, y - 8);
      context.stroke();
    }
    if (hiding) {
      context.fillStyle = PALETTE.turkeyWattle;
      context.beginPath();
      context.arc(cx, y + 16, 5, 0, Math.PI * 2);
      context.fill();
    }
  }

  function drawCorn(cob, cameraX, time) {
    if (cob.eaten) return;
    const x = cob.x - cameraX;
    const bob = Math.sin(time * 3 + cob.bob) * 4;
    const y = cob.y + bob;
    context.fillStyle = PALETTE.cornHusk;
    context.beginPath();
    context.moveTo(x + 4, y + cob.height);
    context.lineTo(x + 16, y + 8);
    context.lineTo(x + 28, y + cob.height);
    context.closePath();
    context.fill();
    context.fillStyle = PALETTE.corn;
    context.beginPath();
    context.ellipse(x + 17, y + cob.height / 2, 11, cob.height / 2 - 2, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = 'rgba(255,255,255,0.5)';
    context.fillRect(x + 12, y + 8, 3, cob.height - 14);
  }

  function drawOven(oven, cameraX, time) {
    const x = oven.x - cameraX;
    const y = FIELD.groundY - 96;
    const flaring = ovenIsFlaring(oven);
    const warning = ovenIsWarning(oven);
    if (flaring) {
      context.fillStyle = 'rgba(255, 106, 26, 0.30)';
      context.beginPath();
      context.ellipse(x + oven.width / 2, y + 20, oven.width * 0.8, 70, 0, 0, Math.PI * 2);
      context.fill();
    }
    context.fillStyle = PALETTE.ovenBody;
    context.fillRect(x, y, oven.width, 96);
    context.fillStyle = '#22262e';
    context.fillRect(x + 12, y + 12, oven.width - 24, 52);
    if (warning && !flaring) {
      // Telegraph: a pulsing warning triangle above the grate, well
      // before the flare, so a player can time the jump.
      const pulse = 0.6 + Math.sin(time * 10) * 0.4;
      context.globalAlpha = pulse;
      context.fillStyle = '#ffc93b';
      context.beginPath();
      context.moveTo(x + oven.width / 2, y - 44);
      context.lineTo(x + oven.width / 2 + 18, y - 12);
      context.lineTo(x + oven.width / 2 - 18, y - 12);
      context.closePath();
      context.fill();
      context.fillStyle = '#241608';
      context.font = 'bold 22px "Trebuchet MS", sans-serif';
      context.textAlign = 'center';
      context.fillText('!', x + oven.width / 2, y - 16);
      context.globalAlpha = 1;
    }
    if (flaring || warning) {
      const flicker = Math.sin(time * 22) * 6;
      context.fillStyle = flaring ? PALETTE.ovenFlame : PALETTE.ovenGlow;
      context.beginPath();
      context.moveTo(x + 20, y + 58);
      context.quadraticCurveTo(x + oven.width / 2, y - 18 - flicker, x + oven.width - 20, y + 58);
      context.closePath();
      context.fill();
      context.fillStyle = '#fff0b8';
      context.beginPath();
      context.moveTo(x + 44, y + 58);
      context.quadraticCurveTo(x + oven.width / 2, y + 8 - flicker, x + oven.width - 44, y + 58);
      context.closePath();
      context.fill();
    }
    context.fillStyle = PALETTE.knifeHandle;
    context.fillRect(x + 8, y + 72, oven.width - 16, 8);
    context.fillStyle = '#fff3dd';
    context.font = 'bold 17px ' + '"Trebuchet MS", sans-serif';
    context.textAlign = 'center';
    context.fillText(flaring ? 'HOT! HOT!' : 'OVEN', x + oven.width / 2, y + 92);
    // A carving knife rests on top of every oven, waiting.
    context.save();
    context.translate(x + oven.width / 2, y - 8);
    context.rotate(-0.25);
    context.fillStyle = '#ffffff';
    context.fillRect(-34, -6, 52, 12);
    context.fillStyle = PALETTE.knifeBlade;
    context.fillRect(-32, -5, 48, 10);
    context.fillStyle = PALETTE.knifeHandle;
    context.fillRect(16, -5, 18, 10);
    context.restore();
  }

  function drawGoalGate(cameraX) {
    const x = WORLD.goalX - cameraX;
    const y = FIELD.groundY - 260;
    context.fillStyle = '#2f6b2a';
    context.fillRect(x, y, 16, 260);
    context.fillRect(x + 104, y, 16, 260);
    context.fillStyle = '#3f8a35';
    context.fillRect(x - 8, y - 18, 136, 30);
    context.fillStyle = '#fff3dd';
    context.font = 'bold 20px "Trebuchet MS", sans-serif';
    context.textAlign = 'center';
    context.fillText('FREEDOM', x + 60, y + 4);
    context.fillStyle = 'rgba(125, 219, 106, 0.25)';
    context.fillRect(x + 16, y + 12, 88, 248);
    // Pine trees beyond the gate.
    context.fillStyle = '#1e4a1a';
    for (let i = 0; i < 3; i += 1) {
      const tx = x + 170 + i * 70;
      context.beginPath();
      context.moveTo(tx, y + 240);
      context.lineTo(tx + 30, y + 90);
      context.lineTo(tx + 60, y + 240);
      context.closePath();
      context.fill();
    }
  }

  /** The turkey, drawn big enough to read at a glance: fan tail, wattle, beak. */
  function drawTurkey(turkey, cameraX, time) {
    const x = turkey.x - cameraX;
    const y = turkey.y;
    const cx = x + turkey.width / 2;
    const bob = turkey.onGround && turkey.moving ? Math.sin(turkey.animTime * 10) * 3 : 0;
    const legSwing = turkey.moving ? Math.sin(turkey.animTime * 10) * 10 : 0;
    const blink = turkey.invulnerable > 0 && Math.floor(time * 10) % 2 === 0;
    if (blink) context.globalAlpha = 0.35;

    // Legs: fixed short legs from the hips to the feet, so the turkey
    // stays grounded on the floor and dangles the same legs in the air
    // instead of growing stilts down to the ground while jumping.
    context.strokeStyle = PALETTE.turkeyLeg;
    context.lineWidth = 5;
    context.beginPath();
    context.moveTo(cx - 12, y + turkey.height - 18 + bob);
    context.lineTo(cx - 12 + legSwing, y + turkey.height + 2 + bob);
    context.moveTo(cx + 12, y + turkey.height - 18 + bob);
    context.lineTo(cx + 12 - legSwing, y + turkey.height + 2 + bob);
    context.stroke();
    context.lineWidth = 4;
    context.beginPath();
    context.moveTo(cx - 12 + legSwing - 5, y + turkey.height + 2 + bob);
    context.lineTo(cx - 12 + legSwing + 6, y + turkey.height + 2 + bob);
    context.moveTo(cx + 12 - legSwing - 5, y + turkey.height + 2 + bob);
    context.lineTo(cx + 12 - legSwing + 6, y + turkey.height + 2 + bob);
    context.stroke();

    // Tail fan: five feathers fanning behind the direction of travel.
    const dir = turkey.facing;
    for (let i = 0; i < 5; i += 1) {
      const angle = (i - 2) * 0.32;
      const spread = -dir;
      context.fillStyle = PALETTE.turkeyTail[i % 3];
      context.save();
      context.translate(cx - dir * 14, y + 34 + bob);
      context.rotate(spread * angle);
      context.beginPath();
      context.ellipse(spread * 26, 0, 30, 11, 0, 0, Math.PI * 2);
      context.fill();
      context.restore();
    }
    // Body.
    context.fillStyle = PALETTE.turkeyBody;
    context.beginPath();
    context.ellipse(cx, y + 40 + bob, 30, 26, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = PALETTE.turkeyDark;
    context.beginPath();
    context.ellipse(cx - dir * 8, y + 48 + bob, 20, 14, 0, 0, Math.PI * 2);
    context.fill();
    // Neck, head, beak, wattle, eye.
    const headX = cx + dir * 24;
    const headY = y + 6 + bob;
    context.fillStyle = PALETTE.turkeyHead;
    context.fillRect(headX - 9, headY - 4, 18, 26);
    context.beginPath();
    context.arc(headX, headY, 13, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = PALETTE.turkeyBeak;
    context.beginPath();
    context.moveTo(headX + dir * 10, headY - 2);
    context.lineTo(headX + dir * 26, headY + 4);
    context.lineTo(headX + dir * 10, headY + 8);
    context.closePath();
    context.fill();
    context.fillStyle = PALETTE.turkeyWattle;
    context.beginPath();
    context.ellipse(headX + dir * 4, headY + 16, 5, 10, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#1c1006';
    context.beginPath();
    context.arc(headX + dir * 5, headY - 3, 3, 0, Math.PI * 2);
    context.fill();
    context.globalAlpha = 1;
  }

  /** Farmer Jed: straw hat, beard, overalls, and a carving knife in hand. */
  function drawFarmer(farmer, cameraX, time) {
    const x = farmer.x - cameraX;
    const y = farmer.y;
    const cx = x + farmer.width / 2;
    const bob = farmer.moving ? Math.sin(farmer.animTime * 9) * 3 : 0;
    const legSwing = farmer.moving ? Math.sin(farmer.animTime * 9) * 11 : 0;
    const searching = farmer.mood === MOOD_SEARCH;

    context.strokeStyle = '#2a1a0e';
    context.lineWidth = 6;
    context.beginPath();
    context.moveTo(cx - 13, y + farmer.height - 22);
    context.lineTo(cx - 13 + legSwing, FIELD.groundY);
    context.moveTo(cx + 13, y + farmer.height - 22);
    context.lineTo(cx + 13 - legSwing, FIELD.groundY);
    context.stroke();
    // Overalls and shirt.
    context.fillStyle = PALETTE.farmerOveralls;
    context.fillRect(cx - 20, y + 44 + bob, 40, 34);
    context.fillStyle = PALETTE.farmerShirt;
    context.fillRect(cx - 24, y + 30 + bob, 48, 20);
    context.fillStyle = PALETTE.farmerOveralls;
    context.fillRect(cx - 20, y + 30 + bob, 9, 26);
    context.fillRect(cx + 11, y + 30 + bob, 9, 26);
    // Arms: one raised with the knife when chasing, one shading his eyes searching.
    context.strokeStyle = PALETTE.farmerShirt;
    context.lineWidth = 9;
    context.beginPath();
    if (searching) {
      context.moveTo(cx - 22, y + 36 + bob);
      context.lineTo(cx - 34, y + 10 + bob);
    } else {
      context.moveTo(cx - 22, y + 36 + bob);
      context.lineTo(cx - 36, y + 52 + bob);
    }
    context.moveTo(cx + 22, y + 36 + bob);
    context.lineTo(cx + 38, y + 8 + bob);
    context.stroke();
    // The carving knife in his raised hand.
    context.save();
    context.translate(cx + 38, y + 8 + bob);
    context.rotate(0.7);
    context.fillStyle = PALETTE.knifeBlade;
    context.fillRect(-6, -34, 10, 30);
    context.fillStyle = PALETTE.knifeHandle;
    context.fillRect(-6, -4, 10, 12);
    context.restore();
    // Head, beard, hat.
    context.fillStyle = PALETTE.farmerSkin;
    context.beginPath();
    context.arc(cx, y + 18 + bob, 17, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = PALETTE.farmerBeard;
    context.beginPath();
    context.arc(cx, y + 26 + bob, 14, 0.15 * Math.PI, 0.85 * Math.PI);
    context.fill();
    context.fillStyle = '#1c1006';
    context.beginPath();
    context.arc(cx - 6, y + 14 + bob, 2.5, 0, Math.PI * 2);
    context.arc(cx + 6, y + 14 + bob, 2.5, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = PALETTE.farmerHat;
    context.fillRect(cx - 24, y - 2 + bob, 48, 7);
    context.fillRect(cx - 14, y - 16 + bob, 28, 15);
    if (searching) {
      context.fillStyle = '#fff3dd';
      context.font = 'bold 26px "Trebuchet MS", sans-serif';
      context.textAlign = 'center';
      context.fillText('?', cx, y - 26 + bob);
    }
  }

  /** A thrown carving knife, drawn large with a motion trail and a
   *  bright outline so it reads in flight; its collision box is unchanged. */
  function drawKnife(knife, cameraX) {
    const x = knife.x - cameraX;
    const cx = x + knife.width / 2;
    const cy = knife.y + knife.height / 2;
    const speed = Math.hypot(knife.vx, knife.vy) || 1;
    const tx = (knife.vx / speed) * 34;
    const ty = (knife.vy / speed) * 34;
    context.strokeStyle = 'rgba(255, 243, 221, 0.65)';
    context.lineWidth = 5;
    context.beginPath();
    context.moveTo(cx - tx, cy - ty);
    context.lineTo(cx - tx * 0.4, cy - ty * 0.4);
    context.stroke();
    context.save();
    context.translate(cx, cy);
    context.rotate(knife.spin);
    context.scale(1.7, 1.7);
    context.fillStyle = '#ffffff';
    context.beginPath();
    context.moveTo(-20, 0);
    context.lineTo(8, -8);
    context.lineTo(20, 0);
    context.lineTo(8, 8);
    context.closePath();
    context.fill();
    context.fillStyle = PALETTE.knifeBlade;
    context.beginPath();
    context.moveTo(-17, 0);
    context.lineTo(8, -6);
    context.lineTo(17, 0);
    context.lineTo(8, 6);
    context.closePath();
    context.fill();
    context.fillStyle = PALETTE.knifeHandle;
    context.fillRect(-24, -4, 9, 8);
    context.restore();
  }

  function drawParticles(particles, cameraX) {
    for (const p of particles) {
      context.globalAlpha = Math.max(0, p.life * 1.6);
      context.fillStyle = p.colour;
      context.fillRect(p.x - cameraX - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    context.globalAlpha = 1;
  }

  /** Ground texture per stage, from deterministic world-x slots so it
   *  never flickers: grass tufts in the farmyard, plank seams in the
   *  barn, tile grout in the kitchen. */
  function drawGroundDetail(stage, cameraX) {
    const top = FIELD.groundY + 12;
    if (stage === 0) {
      context.strokeStyle = 'rgba(60, 36, 10, 0.45)';
      context.lineWidth = 3;
      for (let i = 0; i < 22; i += 1) {
        const wx = Math.floor(cameraX / 64) * 64 + i * 64;
        const h = ((wx * 2654435761) >>> 0) / 4294967296;
        const sx = wx - cameraX + h * 40;
        context.beginPath();
        context.moveTo(sx, top + 34);
        context.lineTo(sx - 5, top + 18);
        context.moveTo(sx + 6, top + 34);
        context.lineTo(sx + 10, top + 20);
        context.stroke();
      }
    } else if (stage === 1) {
      context.strokeStyle = 'rgba(20, 11, 4, 0.5)';
      context.lineWidth = 3;
      for (let i = 0; i < 12; i += 1) {
        const sx = Math.floor(cameraX / 110) * 110 + i * 110 - cameraX;
        context.beginPath();
        context.moveTo(sx, top);
        context.lineTo(sx, FIELD.height);
        context.stroke();
      }
      context.strokeStyle = 'rgba(232, 201, 160, 0.35)';
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(0, top + 52);
      context.lineTo(FIELD.width, top + 52);
      context.stroke();
    } else {
      context.strokeStyle = 'rgba(20, 11, 4, 0.4)';
      context.lineWidth = 2;
      for (let i = 0; i < 12; i += 1) {
        const sx = Math.floor(cameraX / 112) * 112 + i * 112 - cameraX;
        context.beginPath();
        context.moveTo(sx, top);
        context.lineTo(sx, FIELD.height);
        context.stroke();
      }
      context.beginPath();
      context.moveTo(0, top + 52);
      context.lineTo(FIELD.width, top + 52);
      context.stroke();
    }
  }

  /** Paint the scrolling world: backdrop, props, characters, particles. */
  function drawWorld(state, time) {
    const stage = stageAt(state.turkey.x);
    const cameraX = cameraXFor(state.turkey.x);
    drawBackdrop(stage, cameraX, time);
    const [groundTop, ground] = groundFor(stage);
    context.fillStyle = ground;
    context.fillRect(0, FIELD.groundY, FIELD.width, FIELD.height - FIELD.groundY);
    context.fillStyle = groundTop;
    context.fillRect(0, FIELD.groundY, FIELD.width, 10);
    drawGroundDetail(stage, cameraX);
    // Stage boundary signposts.
    context.fillStyle = '#fff3dd';
    context.font = 'bold 18px "Trebuchet MS", sans-serif';
    context.textAlign = 'left';

    for (const bale of state.bales) {
      if (bale.x + bale.width < cameraX || bale.x > cameraX + FIELD.width) continue;
      const hidingHere = state.turkey.hidden
        && Math.abs(state.turkey.x + 31 - (bale.x + 48)) < 74;
      drawBale(bale, cameraX, hidingHere);
    }
    for (const fence of state.fences) {
      if (fence.x < cameraX - 60 || fence.x > cameraX + FIELD.width + 60) continue;
      drawFence(fence, cameraX);
    }
    for (const oven of state.ovens) {
      if (oven.x < cameraX - 200 || oven.x > cameraX + FIELD.width + 200) continue;
      drawOven(oven, cameraX, time);
    }
    for (const cob of state.corn) {
      if (cob.x < cameraX - 60 || cob.x > cameraX + FIELD.width + 60) continue;
      drawCorn(cob, cameraX, time);
    }
    drawGoalGate(cameraX);
    drawFarmer(state.farmer, cameraX, time);
    if (!state.turkey.hidden) {
      drawTurkey(state.turkey, cameraX, time);
    } else {
      // A hidden turkey shows only its tail feathers poking out of the bale.
      const baleX = state.turkey.x - cameraX;
      context.fillStyle = PALETTE.turkeyTail[0];
      context.beginPath();
      context.ellipse(baleX + 31, FIELD.groundY - 78, 20, 8, -0.4, 0, Math.PI * 2);
      context.fill();
    }
    for (const knife of state.knives) drawKnife(knife, cameraX);
    drawParticles(state.particles, cameraX);
    return cameraX;
  }

  /** Paint one frame: backdrop colour, world, then the caller draws the HUD. */
  function draw(state, time) {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = PALETTE.backdrop;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    return drawWorld(state, time);
  }

  resize();
  window.addEventListener('resize', resize);
  return { draw, drawWorld, resize };
}
