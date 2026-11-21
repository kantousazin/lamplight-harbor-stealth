# Lamplight Harbor

An original top-down 2D stealth game for the make.fun "Make the best stealth game" bounty.

Cross a lamplit harbour at night without being caught. Guards patrol fixed, learnable
routes with raycast vision cones that bend around crates, barrels and warehouse walls.
Lamplight makes you easier to spot; shadow is safe. Running is fast but your footsteps
carry — a guard who hears you will come and look. Get spotted and you can still recover:
break line of sight, let the alert meter fade, and slip away while the guard searches
the last place you were seen. Steal up to three cargo manifests on the way, then reach
the glowing exit pier and escape by boat.

## Play

Open `game/index.html` in a desktop browser (or `node serve.ts`, then
http://localhost:8080). No build step, no network requests.

- WASD / arrow keys — move
- Shift — run (fast, loud)
- C / Ctrl — sneak (slow, quiet, harder to spot)
- P / Esc — pause, R — retry, Space / click — start

## Layout

- `game/src/world.js` — harbour layout: occluders, lamps, patrol routes, exit
- `game/src/vision.js` — who can see whom, and how fast the alert fills
- `game/src/guards.js` — patrol / suspicious / chase / search / return behaviour
- `game/src/player.js` — movement stances, footstep noise, pickups
- `game/src/render.js` — the lamplit harbour, cones, HUD and screens
- `game/src/audio.js` — synthesized footsteps and alert cues (no audio files)
- `game/src/input.js`, `game/src/main.js`, `game/src/shots.js` — input, loop, screenshots

MIT licensed (see LICENSE).
