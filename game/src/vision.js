// LAMPLIGHT HARBOR — guard vision: distance, facing angle, lamp light and occlusion
// decide whether a guard can see the player, and how fast the alert meter fills.

import { ALERT, GUARD } from './config.js';
import { isInLampLight, lineOfSightBlocked } from './world.js';

export function angleDifference(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/**
 * How visible the player is to one guard right now: 0 = unseen, otherwise a fill
 * rate (per second) for that guard's alert meter. Lamp light extends a guard's
 * reach and speeds the fill; shadow and sneaking slow it down.
 */
export function visibilityRate(guard, player) {
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const distance = Math.hypot(dx, dy);
  const inLight = isInLampLight(player.x, player.y);
  const range = inLight ? GUARD.viewDistance : GUARD.viewDistanceInShadow;
  if (distance > range) return 0;
  const facing = Math.atan2(dy, dx);
  if (Math.abs(angleDifference(facing, guard.angle)) > GUARD.viewHalfAngle) return 0;
  if (lineOfSightBlocked(guard.x, guard.y, player.x, player.y)) return 0;
  const closeness = 1 - distance / range; // 0 at the rim, 1 at the guard's feet
  let rate = ALERT.fillPerSecondFar + (ALERT.fillPerSecondClose - ALERT.fillPerSecondFar) * closeness;
  if (!inLight) rate *= ALERT.shadowFactor;
  if (player.sneaking) rate *= ALERT.sneakFactor;
  return rate;
}

/** The player's current footstep noise radius, by stance. */
export function noiseRadiusFor(player, config) {
  if (!player.moving) return 0;
  if (player.running) return config.runNoiseRadius;
  if (player.sneaking) return config.sneakNoiseRadius;
  return config.walkNoiseRadius;
}
