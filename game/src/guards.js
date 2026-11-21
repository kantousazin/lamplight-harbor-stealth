// LAMPLIGHT HARBOR — the guards: fixed patrols you can learn, an alert meter per
// guard, and a forgiving detection loop (suspicious -> chase -> search -> return)
// so a near-miss costs you time, not the run. Footsteps turn heads: a guard who
// hears running investigates the spot the noise came from.

import { ALERT, FIELD, GUARD } from './config.js';
import { PATROLS, circleHitsOccluder } from './world.js';
import { angleDifference, noiseRadiusFor, visibilityRate } from './vision.js';
import { PLAYER } from './config.js';

export const GUARD_PATROL = 'patrol';
export const GUARD_SUSPICIOUS = 'suspicious';
export const GUARD_CHASE = 'chase';
export const GUARD_SEARCH = 'search';
export const GUARD_RETURN = 'return';

export function createGuards() {
  return PATROLS.map((route, index) => ({
    x: route[0].x,
    y: route[0].y,
    angle: Math.atan2(route[1].y - route[0].y, route[1].x - route[0].x),
    route,
    waypoint: 1,
    wait: 0,
    lookPhase: index * 1.7,
    state: GUARD_PATROL,
    alert: 0,
    lastSeenX: 0,
    lastSeenY: 0,
    lostFor: 0,
    searchWait: 0,
    investigateX: 0,
    investigateY: 0,
    hasInvestigate: false,
  }));
}

function moveGuard(guard, targetX, targetY, speed, dt, turnRate) {
  const dx = targetX - guard.x;
  const dy = targetY - guard.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 2) return true;
  const wanted = Math.atan2(dy, dx);
  const diff = angleDifference(wanted, guard.angle);
  const maxTurn = turnRate * dt;
  guard.angle += Math.max(-maxTurn, Math.min(maxTurn, diff));
  const step = Math.min(distance, speed * dt);
  const nx = guard.x + Math.cos(guard.angle) * step;
  const ny = guard.y + Math.sin(guard.angle) * step;
  if (!circleHitsOccluder(nx, ny, GUARD.radius)) {
    guard.x = nx;
    guard.y = ny;
  } else if (!circleHitsOccluder(nx, guard.y, GUARD.radius)) {
    guard.x = nx;
  } else if (!circleHitsOccluder(guard.x, ny, GUARD.radius)) {
    guard.y = ny;
  }
  guard.x = Math.max(GUARD.radius, Math.min(FIELD.width - GUARD.radius, guard.x));
  guard.y = Math.max(GUARD.radius, Math.min(FIELD.height - GUARD.radius, guard.y));
  return distance < 10;
}

function patrolStep(guard, dt) {
  if (guard.wait > 0) {
    guard.wait -= dt;
    guard.lookPhase += dt;
    guard.angle += Math.sin(guard.lookPhase * 2.2) * 0.9 * dt; // look left, look right
    return;
  }
  const target = guard.route[guard.waypoint];
  if (moveGuard(guard, target.x, target.y, GUARD.patrolSpeed, dt, GUARD.turnRate)) {
    guard.waypoint = (guard.waypoint + 1) % guard.route.length;
    guard.wait = GUARD.waypointWaitSeconds;
    guard.lookPhase = 0;
  }
}

/**
 * Advance every guard one step. Returns true when a guard catches the player.
 * `heard` events are pushed into `events` so the caller can play the cue.
 */
export function stepGuards(guards, player, dt, events) {
  const noise = noiseRadiusFor(player, PLAYER);
  let caught = false;
  for (const guard of guards) {
    const rate = visibilityRate(guard, player);
    const seesPlayer = rate > 0;
    if (seesPlayer) {
      guard.alert = Math.min(1, guard.alert + rate * dt);
      guard.lastSeenX = player.x;
      guard.lastSeenY = player.y;
      guard.lostFor = 0;
    } else {
      guard.lostFor += dt;
      const decay = guard.state === GUARD_CHASE ? ALERT.decayPerSecond * 0.4 : ALERT.decayPerSecond;
      guard.alert = Math.max(0, guard.alert - decay * dt);
    }

    // Hearing: running footsteps inside the noise radius turn the guard toward you.
    if (!seesPlayer && noise > 0 && guard.state !== GUARD_CHASE) {
      const d = Math.hypot(player.x - guard.x, player.y - guard.y);
      if (d <= noise) {
        guard.investigateX = player.x;
        guard.investigateY = player.y;
        guard.hasInvestigate = true;
        guard.alert = Math.min(1, guard.alert + 0.25 * dt * 4);
        events.push('heard');
      }
    }

    if (guard.alert >= 1) guard.state = GUARD_CHASE;
    else if (guard.state === GUARD_CHASE && guard.lostFor > GUARD.loseSightSeconds) {
      guard.state = GUARD_SEARCH;
      guard.searchWait = 2.2;
    } else if (guard.state !== GUARD_CHASE && guard.alert >= ALERT.suspiciousAt) {
      guard.state = GUARD_SUSPICIOUS;
    } else if (guard.state === GUARD_SUSPICIOUS && guard.alert < 0.08) {
      guard.state = guard.hasInvestigate ? GUARD_SEARCH : GUARD_RETURN;
    }

    if (guard.state === GUARD_PATROL) {
      if (guard.hasInvestigate) guard.state = GUARD_SEARCH;
      else patrolStep(guard, dt);
    } else if (guard.state === GUARD_SUSPICIOUS) {
      // Freeze and stare at what caught the eye: break line of sight to recover.
      const wanted = Math.atan2(player.y - guard.y, player.x - guard.x);
      const diff = angleDifference(wanted, guard.angle);
      guard.angle += Math.max(-3 * dt, Math.min(3 * dt, diff));
    } else if (guard.state === GUARD_CHASE) {
      const tx = seesPlayer ? player.x : guard.lastSeenX;
      const ty = seesPlayer ? player.y : guard.lastSeenY;
      moveGuard(guard, tx, ty, GUARD.chaseSpeed, dt, GUARD.chaseTurnRate);
      const d = Math.hypot(player.x - guard.x, player.y - guard.y);
      if (d < GUARD.catchDistance) caught = true;
    } else if (guard.state === GUARD_SEARCH) {
      const tx = guard.hasInvestigate ? guard.investigateX : guard.lastSeenX;
      const ty = guard.hasInvestigate ? guard.investigateY : guard.lastSeenY;
      if (moveGuard(guard, tx, ty, GUARD.searchSpeed, dt, GUARD.turnRate)) {
        guard.searchWait -= dt;
        guard.lookPhase += dt;
        guard.angle += Math.sin(guard.lookPhase * 2.6) * 1.1 * dt;
        if (guard.searchWait <= 0) {
          guard.hasInvestigate = false;
          guard.alert = Math.min(guard.alert, 0.2);
          guard.state = GUARD_RETURN;
        }
      }
    } else if (guard.state === GUARD_RETURN) {
      // Head back to the nearest point of the own patrol loop, then resume it.
      let nearest = 0;
      let best = Infinity;
      guard.route.forEach((point, i) => {
        const d = Math.hypot(point.x - guard.x, point.y - guard.y);
        if (d < best) { best = d; nearest = i; }
      });
      const target = guard.route[nearest];
      if (moveGuard(guard, target.x, target.y, GUARD.patrolSpeed, dt, GUARD.turnRate)) {
        guard.waypoint = (nearest + 1) % guard.route.length;
        guard.wait = 0.5;
        guard.state = GUARD_PATROL;
      }
    }
  }
  return caught;
}
