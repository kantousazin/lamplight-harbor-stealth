// LAMPLIGHT HARBOR — the renderer: a lamplit harbour at night where light means
// danger and shadow means safety. Vision cones are raycast fans that bend around
// crates and walls, graded yellow -> orange -> red as a guard's alert rises, so a
// screenshot alone explains the whole game.

import { FIELD, FONT, GUARD, PALETTE } from './config.js';
import { EXIT_ZONE, LAMPS, OCCLUDERS, KIND_BARREL, KIND_CRATE, raycastDistance } from './world.js';
import { GUARD_CHASE, GUARD_SEARCH, GUARD_SUSPICIOUS } from './guards.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_CAUGHT = 'caught';
export const SCREEN_ESCAPED = 'escaped';

const CONE_RAYS = 26;

function coneColour(guard) {
  if (guard.state === GUARD_CHASE) return PALETTE.coneChase ?? 'rgba(255,70,52,0.50)';
  if (guard.alert >= 0.35) return 'rgba(255,150,52,0.42)';
  return 'rgba(255,214,92,0.30)';
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function drawCone(guard) {
    const range = GUARD.viewDistance;
    ctx.beginPath();
    ctx.moveTo(guard.x, guard.y);
    for (let i = 0; i <= CONE_RAYS; i += 1) {
      const angle = guard.angle - GUARD.viewHalfAngle + (2 * GUARD.viewHalfAngle * i) / CONE_RAYS;
      const d = raycastDistance(guard.x, guard.y, angle, range);
      ctx.lineTo(guard.x + Math.cos(angle) * d, guard.y + Math.sin(angle) * d);
    }
    ctx.closePath();
    ctx.fillStyle = coneColour(guard);
    ctx.fill();
  }

  function drawOccluder(box) {
    if (box.kind === KIND_BARREL) {
      ctx.fillStyle = PALETTE.barrel;
      ctx.strokeStyle = PALETTE.barrelEdge;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(box.x + box.w / 2, box.y + box.h / 2, box.w / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(box.x + box.w / 2, box.y + box.h / 2, box.w / 4, 0, Math.PI * 2);
      ctx.stroke();
      return;
    }
    ctx.fillStyle = box.kind === KIND_CRATE ? PALETTE.crate : PALETTE.wall;
    ctx.strokeStyle = box.kind === KIND_CRATE ? PALETTE.crateEdge : PALETTE.wallEdge;
    ctx.lineWidth = 3;
    ctx.fillRect(box.x, box.y, box.w, box.h);
    ctx.strokeRect(box.x, box.y, box.w, box.h);
    if (box.kind === KIND_CRATE) {
      ctx.beginPath();
      ctx.moveTo(box.x, box.y);
      ctx.lineTo(box.x + box.w, box.y + box.h);
      ctx.moveTo(box.x + box.w, box.y);
      ctx.lineTo(box.x, box.y + box.h);
      ctx.strokeStyle = 'rgba(60,40,16,0.55)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  function drawGuard(guard) {
    // alert arc over the head: empty, part-full with "?", full with "!"
    ctx.fillStyle = PALETTE.guardBody;
    ctx.strokeStyle = '#10151f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = PALETTE.guardCap;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, 14, guard.angle - 2.2, guard.angle + 2.2);
    ctx.lineTo(guard.x, guard.y);
    ctx.closePath();
    ctx.fill();
    if (guard.alert > 0.03) {
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(guard.x, guard.y, 21, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = guard.state === GUARD_CHASE ? PALETTE.danger : PALETTE.guardSuspicious ?? '#ffb340';
      ctx.beginPath();
      ctx.arc(guard.x, guard.y, 21, -Math.PI / 2, -Math.PI / 2 + guard.alert * Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = guard.state === GUARD_CHASE ? PALETTE.danger : '#ffb340';
      ctx.font = `bold 17px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText(guard.state === GUARD_CHASE ? '!' : '?', guard.x, guard.y - 28);
    } else if (guard.state === GUARD_SEARCH) {
      ctx.fillStyle = PALETTE.muted;
      ctx.font = `bold 15px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('…', guard.x, guard.y - 26);
    }
  }

  function drawScene(state) {
    ctx.fillStyle = PALETTE.night;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    // water strip along the south edge, dock boards everywhere else
    ctx.fillStyle = PALETTE.dock;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = PALETTE.water;
    ctx.fillRect(0, FIELD.height - 26, FIELD.width, 26);
    ctx.strokeStyle = PALETTE.waterLine;
    ctx.lineWidth = 2;
    for (let x = 20; x < FIELD.width; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, FIELD.height - 14);
      ctx.lineTo(x + 30, FIELD.height - 14);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.045)';
    ctx.lineWidth = 1;
    for (let x = 0; x < FIELD.width; x += 80) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, FIELD.height - 26); ctx.stroke();
    }
    // lamp light pools: bright means dangerous
    for (const lamp of LAMPS) {
      const gradient = ctx.createRadialGradient(lamp.x, lamp.y, 8, lamp.x, lamp.y, lamp.r);
      gradient.addColorStop(0, 'rgba(255,205,100,0.34)');
      gradient.addColorStop(1, 'rgba(255,205,100,0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(lamp.x, lamp.y, lamp.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // exit pier
    const pulse = 0.65 + 0.35 * Math.sin(state.elapsed * 3);
    ctx.fillStyle = `rgba(80,255,170,${0.20 + 0.12 * pulse})`;
    ctx.fillRect(EXIT_ZONE.x, EXIT_ZONE.y, EXIT_ZONE.w, EXIT_ZONE.h);
    ctx.strokeStyle = PALETTE.exitGlow;
    ctx.lineWidth = 3;
    ctx.strokeRect(EXIT_ZONE.x, EXIT_ZONE.y, EXIT_ZONE.w, EXIT_ZONE.h);
    ctx.fillStyle = PALETTE.exitGlow;
    ctx.font = `bold 17px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('EXIT', EXIT_ZONE.x + EXIT_ZONE.w / 2, EXIT_ZONE.y - 10);
    ctx.font = `26px ${FONT}`;
    ctx.fillText('⛵', EXIT_ZONE.x + EXIT_ZONE.w / 2, EXIT_ZONE.y + EXIT_ZONE.h / 2 + 9);

    for (const guard of state.guards) drawCone(guard);
    for (const box of OCCLUDERS) drawOccluder(box);
    // lamp posts on top of their pools
    for (const lamp of LAMPS) {
      ctx.fillStyle = '#0d1320';
      ctx.fillRect(lamp.x - 3, lamp.y - 3, 6, 6);
      ctx.fillStyle = PALETTE.lampCore;
      ctx.beginPath();
      ctx.arc(lamp.x, lamp.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    // manifests
    for (const item of state.manifests) {
      if (item.taken) continue;
      ctx.fillStyle = '#ffe9a8';
      ctx.strokeStyle = '#8a6b1f';
      ctx.lineWidth = 2;
      ctx.fillRect(item.x - 9, item.y - 11, 18, 22);
      ctx.strokeRect(item.x - 9, item.y - 11, 18, 22);
      ctx.strokeStyle = '#8a6b1f';
      ctx.beginPath();
      ctx.moveTo(item.x - 5, item.y - 4); ctx.lineTo(item.x + 5, item.y - 4);
      ctx.moveTo(item.x - 5, item.y + 2); ctx.lineTo(item.x + 5, item.y + 2);
      ctx.stroke();
    }
    // footstep noise ring: running is a wide loud ring, walking a small one
    const player = state.player;
    if (player.moving && !player.sneaking) {
      const radius = (player.running ? 150 : 46) * (0.35 + 0.65 * player.noisePulse);
      ctx.strokeStyle = `rgba(160,220,255,${0.5 * (1 - player.noisePulse)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(player.x, player.y, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    // player: teal smuggler with a yellow scarf, crouched smaller when sneaking
    const r = player.sneaking ? 10 : 13;
    ctx.fillStyle = PALETTE.playerBody;
    ctx.strokeStyle = '#0b2b28';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.x, player.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = PALETTE.playerScarf;
    ctx.beginPath();
    ctx.arc(player.x, player.y, r, player.angle + 2.4, player.angle + 3.9);
    ctx.lineTo(player.x, player.y);
    ctx.closePath();
    ctx.fill();

    for (const guard of state.guards) drawGuard(guard);
  }

  function drawHud(state, best) {
    ctx.fillStyle = 'rgba(10,16,28,0.78)';
    ctx.fillRect(0, 0, FIELD.width, 46);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `bold 19px ${FONT}`;
    ctx.textAlign = 'left';
    const worst = Math.max(...state.guards.map((g) => g.alert));
    const stateWord = state.guards.some((g) => g.state === GUARD_CHASE) ? 'SPOTTED!' : worst >= 0.35 ? 'SUSPICIOUS' : 'UNSEEN';
    ctx.fillText(`🕵 ALERT ${stateWord}`, 16, 30);
    ctx.fillStyle = '#2a3648';
    ctx.fillRect(330, 17, 130, 12);
    ctx.fillStyle = worst >= 0.99 ? PALETTE.danger : worst >= 0.35 ? '#ff9634' : '#ffd94a';
    if (worst > 0.01) ctx.fillRect(330, 17, 130 * worst, 12);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `16px ${FONT}`;
    ctx.fillText(`📦 Manifests ${state.held}/3`, 486, 30);
    ctx.fillText(`⏱ ${state.elapsed.toFixed(1)}s`, 676, 30);
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText('WASD move · Shift run (loud) · C sneak (quiet)', 800, 30);
    if (best > 0) {
      ctx.textAlign = 'right';
      ctx.fillText(`Best ${best}`, FIELD.width - 14, 30);
      ctx.textAlign = 'left';
    }
  }

  function panel(title, lines) {
    ctx.fillStyle = 'rgba(6,10,20,0.55)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = PALETTE.text;
    ctx.textAlign = 'center';
    ctx.font = `bold 54px ${FONT}`;
    ctx.fillText(title, FIELD.width / 2, 268);
    ctx.font = `21px ${FONT}`;
    lines.forEach((line, i) => {
      ctx.fillStyle = i === lines.length - 1 ? PALETTE.muted : PALETTE.text;
      ctx.fillText(line, FIELD.width / 2, 330 + i * 34);
    });
    ctx.textAlign = 'left';
  }

  function draw(state, screen, best) {
    drawScene(state);
    if (screen === SCREEN_PLAY) { drawHud(state, best); return; }
    if (screen === SCREEN_PAUSED) {
      drawHud(state, best);
      panel('PAUSED', ['Press P or Space to keep sneaking.']);
      return;
    }
    if (screen === SCREEN_TITLE) {
      panel('LAMPLIGHT HARBOR', [
        'Cross the lamplit harbour without being caught.',
        'Hide behind crates, barrels and walls. Shadow is safe — lamplight is not.',
        'Guards patrol fixed routes. Running is fast, but your footsteps give you away.',
        '',
        'Press Space or click to start',
      ]);
      return;
    }
    if (screen === SCREEN_CAUGHT) {
      panel('CAUGHT!', [
        `The harbour watch has you, after ${state.elapsed.toFixed(1)} seconds.`,
        `Manifests stolen: ${state.held}/3`,
        'Break line of sight and let the alert fade — a near-miss is not the end.',
        '',
        'Press R or Space to try again',
      ]);
      return;
    }
    if (screen === SCREEN_ESCAPED) {
      panel('YOU ESCAPED ⛵', [
        `Away by boat in ${state.elapsed.toFixed(1)} seconds.`,
        `Manifests stolen: ${state.held}/3 · Times spotted: ${state.spottedCount}`,
        state.held === 3 && state.spottedCount === 0 ? 'A perfect ghost run.' : 'A cleaner run is out there: all 3 manifests, never spotted.',
        '',
        'Press R or Space to sneak again',
      ]);
    }
  }

  return { draw };
}
