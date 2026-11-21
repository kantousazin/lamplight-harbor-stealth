// LAMPLIGHT HARBOR — boot and the one loop: fixed-step simulation, screens
// (title, play, paused, caught, escaped), sound cues and the screenshot staging
// hook (?shot=start|play|end&seed=N paints a real simulated scene, then sets
// window.__shotReady).

import { BEST_KEY, STEP } from './config.js';
import { createAudio } from './audio.js';
import { createGuards, stepGuards, GUARD_CHASE, GUARD_SUSPICIOUS } from './guards.js';
import { ACTION_CONFIRM, ACTION_PAUSE, ACTION_RETRY, createInput } from './input.js';
import { collectManifests, createPlayer, playerReachedExit, resetManifests, resetPlayer, stepPlayer } from './player.js';
import { createRenderer, SCREEN_CAUGHT, SCREEN_ESCAPED, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const audio = createAudio();

function createGameState() {
  const state = {
    player: createPlayer(),
    guards: createGuards(),
    manifests: resetManifests(),
    elapsed: 0,
    held: 0,
    spottedCount: 0,
    wasChased: false,
    reset() {
      resetPlayer(state.player);
      state.guards = createGuards();
      state.manifests = resetManifests();
      state.elapsed = 0;
      state.held = 0;
      state.spottedCount = 0;
      state.wasChased = false;
    },
    /** One fixed step. Returns 'caught' | 'escaped' | null. */
    step(dt, input) {
      state.elapsed += dt;
      stepPlayer(state.player, input, dt);
      const events = [];
      const caught = stepGuards(state.guards, state.player, dt, events);
      const chased = state.guards.some((g) => g.state === GUARD_CHASE);
      if (chased && !state.wasChased) {
        state.spottedCount += 1;
        audio.chase();
      }
      if (state.guards.some((g) => g.state === GUARD_SUSPICIOUS) && !chased) audio.suspicious();
      state.wasChased = chased;
      if (events.includes('heard')) audio.suspicious();
      if (state.player.moving && !state.player.sneaking) audio.footstep(state.player.running);
      const heldBefore = state.held;
      state.held = collectManifests(state.player, state.manifests);
      if (state.held > heldBefore) audio.pickup();
      if (caught) return 'caught';
      if (playerReachedExit(state.player)) {
        audio.escaped();
        return 'escaped';
      }
      return null;
    },
  };
  return state;
}

const state = createGameState();
const renderer = createRenderer(canvas);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch { return 0; }
}
function saveBest(value) {
  try { window.localStorage.setItem(BEST_KEY, String(value)); } catch { /* private window */ }
}

if (shot) {
  const scene = stageShot(shot, state);
  let painted = 0;
  const paint = () => {
    renderer.draw(state, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  };
  requestAnimationFrame(paint);
} else {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  function announce(message) { status.textContent = message; }
  function startGame() {
    state.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    audio.unlock();
    announce('Sneaking. Reach the exit pier.');
  }
  function finish(outcome) {
    screen = outcome === 'escaped' ? SCREEN_ESCAPED : SCREEN_CAUGHT;
    if (outcome === 'escaped') {
      const score = Math.round(1000 - state.elapsed * 4 + state.held * 250 - state.spottedCount * 150);
      if (score > best) { best = score; saveBest(best); }
      announce(`Escaped in ${state.elapsed.toFixed(1)} seconds with ${state.held} manifests.`);
    } else {
      announce('Caught by the harbour watch.');
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    const actions = input.takeActions();
    if (actions & ACTION_CONFIRM) audio.unlock();
    if ((actions & ACTION_CONFIRM) && (screen === SCREEN_TITLE || screen === SCREEN_CAUGHT || screen === SCREEN_ESCAPED)) startGame();
    else if ((actions & ACTION_RETRY) && (screen === SCREEN_CAUGHT || screen === SCREEN_ESCAPED || screen === SCREEN_PLAY)) startGame();
    else if ((actions & ACTION_PAUSE) && screen === SCREEN_PLAY) { screen = SCREEN_PAUSED; announce('Paused.'); }
    else if ((actions & (ACTION_PAUSE | ACTION_CONFIRM)) && screen === SCREEN_PAUSED) { screen = SCREEN_PLAY; announce('Sneaking.'); }

    if (screen === SCREEN_TITLE) {
      // The harbour lives behind the title: guards patrol, nobody is hunted.
      while (accumulator >= STEP) { state.guards.forEach((g) => { g.alert = 0; }); stepGuards(state.guards, { x: -999, y: -999, sneaking: false, moving: false, running: false }, STEP, []); state.elapsed += STEP; accumulator -= STEP; }
    } else if (screen === SCREEN_PLAY) {
      while (accumulator >= STEP && screen === SCREEN_PLAY) {
        const outcome = state.step(STEP, input.direction());
        accumulator -= STEP;
        if (outcome) finish(outcome);
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(state, screen, best);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) { screen = SCREEN_PAUSED; announce('Paused.'); }
  });
  announce('Lamplight Harbor. Press Space or click to start.');
  requestAnimationFrame(frame);
}
