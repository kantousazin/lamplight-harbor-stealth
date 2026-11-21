// LAMPLIGHT HARBOR — staged scenes for the screenshots: each scene is the real
// game simulated forward, never a mock-up. `start` shows the title over the live
// harbour, `play` a near-miss behind a crate with the alert meter half full, and
// `end` the smuggler stepping onto the exit pier.

import { STEP } from './config.js';
import { GUARD_SUSPICIOUS } from './guards.js';
import { SCREEN_CAUGHT, SCREEN_ESCAPED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { GUARD_CHASE } from './guards.js';

function simulate(state, seconds, input) {
  const steps = Math.round(seconds / STEP);
  for (let i = 0; i < steps; i += 1) state.step(STEP, input);
}

export function stageShot(name, state) {
  state.reset();
  if (name === 'play') {
    // Run the harbour for a while, then place a textbook near-miss: the smuggler
    // sneaks along a crate while a guard's cone sweeps the crate's other side.
    simulate(state, 6, { x: 0, y: 0, run: false, sneak: false });
    const player = state.player;
    player.x = 470;
    player.y = 232;
    player.sneaking = true;
    player.moving = true;
    player.angle = 0.4;
    const guard = state.guards[0];
    guard.x = 392;
    guard.y = 268;
    guard.angle = -0.5;
    guard.alert = 0.62;
    guard.state = GUARD_SUSPICIOUS;
    state.held = 1;
    state.manifests[0].taken = true;
    state.elapsed = 23.4;
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'end') {
    simulate(state, 4, { x: 0, y: 0, run: false, sneak: false });
    const player = state.player;
    player.x = 1170;
    player.y = 366;
    player.moving = true;
    player.running = true;
    player.angle = 0;
    player.noisePulse = 0.55;
    state.held = 2;
    state.manifests[0].taken = true;
    state.manifests[1].taken = true;
    state.elapsed = 47.8;
    state.spottedCount = 1;
    return { screen: SCREEN_ESCAPED, best: 0 };
  }
  if (name === 'caught') {
    simulate(state, 5, { x: 0, y: 0, run: false, sneak: false });
    const player = state.player;
    player.x = 620;
    player.y = 470;
    player.moving = true;
    player.running = true;
    player.noisePulse = 0.4;
    player.angle = 2.6;
    const guard = state.guards[1];
    guard.x = 585;
    guard.y = 445;
    guard.angle = 0.7;
    guard.alert = 1;
    guard.state = GUARD_CHASE;
    state.elapsed = 31.2;
    state.held = 1;
    state.manifests[0].taken = true;
    return { screen: SCREEN_CAUGHT, best: 0 };
  }
  simulate(state, 5, { x: 0, y: 0, run: false, sneak: false });
  return { screen: SCREEN_TITLE, best: 0 };
}
