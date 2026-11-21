// LAMPLIGHT HARBOR — the smuggler you control: walk, run (fast but loud) or sneak
// (slow, quiet, harder to spot). Movement is blocked by the same occluders that
// block sight, so hugging a crate keeps you both safe and hidden.

import { FIELD, PLAYER } from './config.js';
import { EXIT_ZONE, MANIFESTS, PLAYER_START, circleHitsOccluder } from './world.js';

export function createPlayer() {
  return {
    x: PLAYER_START.x,
    y: PLAYER_START.y,
    angle: 0,
    moving: false,
    running: false,
    sneaking: false,
    noisePulse: 0, // 0..1 phase of the expanding footstep ring, for the renderer
    stepTimer: 0,
  };
}

export function resetPlayer(player) {
  player.x = PLAYER_START.x;
  player.y = PLAYER_START.y;
  player.moving = false;
  player.noisePulse = 0;
}

/** Advance the player one fixed step from a direction input {x, y, run, sneak}. */
export function stepPlayer(player, input, dt) {
  const length = Math.hypot(input.x, input.y);
  player.moving = length > 0.01;
  player.running = player.moving && input.run;
  player.sneaking = player.moving && input.sneak && !input.run;
  if (!player.moving) {
    player.noisePulse = 0;
    return;
  }
  const speed = player.running ? PLAYER.runSpeed : player.sneaking ? PLAYER.sneakSpeed : PLAYER.walkSpeed;
  const dx = (input.x / length) * speed * dt;
  const dy = (input.y / length) * speed * dt;
  player.angle = Math.atan2(input.y, input.x);
  if (!circleHitsOccluder(player.x + dx, player.y, PLAYER.radius)) player.x += dx;
  if (!circleHitsOccluder(player.x, player.y + dy, PLAYER.radius)) player.y += dy;
  player.x = Math.max(PLAYER.radius, Math.min(FIELD.width - PLAYER.radius, player.x));
  player.y = Math.max(PLAYER.radius, Math.min(FIELD.height - PLAYER.radius, player.y));
  // Footstep ring: running pulses fast and wide, walking slow and small, sneaking silent.
  const interval = player.running ? 0.30 : 0.46;
  player.stepTimer += dt;
  if (player.stepTimer >= interval) player.stepTimer = 0;
  player.noisePulse = player.sneaking ? 0 : player.stepTimer / interval;
}

/** Collect a manifest by walking over it. Returns how many are held now. */
export function collectManifests(player, manifests) {
  let held = 0;
  for (const item of manifests) {
    if (!item.taken && Math.hypot(item.x - player.x, item.y - player.y) < 24) item.taken = true;
    if (item.taken) held += 1;
  }
  return held;
}

export function resetManifests() {
  return MANIFESTS.map((item) => ({ ...item, taken: false }));
}

export function playerReachedExit(player) {
  return (
    player.x >= EXIT_ZONE.x && player.x <= EXIT_ZONE.x + EXIT_ZONE.w &&
    player.y >= EXIT_ZONE.y && player.y <= EXIT_ZONE.y + EXIT_ZONE.h
  );
}
