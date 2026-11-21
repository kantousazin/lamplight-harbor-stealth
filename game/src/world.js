// LAMPLIGHT HARBOR — the harbour layout: occluders you can hide behind, lamps whose
// light makes you easier to spot, the exit pier, guard patrol routes and the cargo
// manifests worth stealing on the way out. Pure data plus geometry helpers; no drawing.

export const KIND_CRATE = 'crate';
export const KIND_BARREL = 'barrel';
export const KIND_WALL = 'wall';

/** Rectangles that block both movement and sight. x/y is the top-left corner. */
export const OCCLUDERS = [
  // warehouse walls (long, unmistakable cover)
  { kind: KIND_WALL, x: 300, y: 96, w: 26, h: 210 },
  { kind: KIND_WALL, x: 300, y: 414, w: 26, h: 210 },
  { kind: KIND_WALL, x: 690, y: 0, w: 26, h: 190 },
  { kind: KIND_WALL, x: 690, y: 300, w: 26, h: 200 },
  { kind: KIND_WALL, x: 1010, y: 420, w: 26, h: 220 },
  { kind: KIND_WALL, x: 520, y: 330, w: 170, h: 24 },
  // crate stacks (warm wood: readable cover at a glance)
  { kind: KIND_CRATE, x: 120, y: 170, w: 74, h: 54 },
  { kind: KIND_CRATE, x: 128, y: 470, w: 88, h: 60 },
  { kind: KIND_CRATE, x: 430, y: 150, w: 84, h: 58 },
  { kind: KIND_CRATE, x: 452, y: 520, w: 92, h: 62 },
  { kind: KIND_CRATE, x: 800, y: 130, w: 86, h: 58 },
  { kind: KIND_CRATE, x: 812, y: 520, w: 96, h: 64 },
  { kind: KIND_CRATE, x: 1080, y: 140, w: 84, h: 58 },
  { kind: KIND_CRATE, x: 560, y: 96, w: 64, h: 48 },
  // barrels (round cover, drawn as circles but blocking as squares)
  { kind: KIND_BARREL, x: 210, y: 330, w: 40, h: 40 },
  { kind: KIND_BARREL, x: 610, y: 560, w: 40, h: 40 },
  { kind: KIND_BARREL, x: 920, y: 330, w: 40, h: 40 },
  { kind: KIND_BARREL, x: 1150, y: 470, w: 40, h: 40 },
];

/** Lamp posts. Inside a lamp's light you are spotted faster; the dark between lamps is safe. */
export const LAMPS = [
  { x: 190, y: 90, r: 118 },
  { x: 470, y: 640, r: 118 },
  { x: 620, y: 250, r: 122 },
  { x: 950, y: 90, r: 118 },
  { x: 900, y: 640, r: 118 },
  { x: 1180, y: 250, r: 110 },
];

export const PLAYER_START = { x: 70, y: 640 };

/** The glowing pier at the east edge: reach it unseen (or at least uncaught) to escape. */
export const EXIT_ZONE = { x: 1204, y: 300, w: 76, h: 130 };

/** Optional cargo manifests: bonus score, each guarded by a patrol. */
export const MANIFESTS = [
  { x: 468, y: 178, taken: false },
  { x: 842, y: 158, taken: false },
  { x: 856, y: 548, taken: false },
];

/** Fixed, learnable patrol loops. Guards pause at each waypoint and look around. */
export const PATROLS = [
  [{ x: 180, y: 260 }, { x: 520, y: 260 }, { x: 520, y: 90 }, { x: 180, y: 90 }],
  [{ x: 420, y: 430 }, { x: 420, y: 650 }, { x: 950, y: 650 }, { x: 950, y: 430 }],
  [{ x: 790, y: 250 }, { x: 1150, y: 250 }, { x: 1150, y: 60 }, { x: 790, y: 60 }],
  [{ x: 1080, y: 560 }, { x: 1080, y: 380 }, { x: 760, y: 380 }, { x: 760, y: 560 }],
];

export function isInLampLight(x, y) {
  for (const lamp of LAMPS) {
    const dx = x - lamp.x;
    const dy = y - lamp.y;
    if (dx * dx + dy * dy <= lamp.r * lamp.r) return true;
  }
  return false;
}

export function circleHitsOccluder(x, y, radius) {
  for (const box of OCCLUDERS) {
    const nearX = Math.max(box.x, Math.min(x, box.x + box.w));
    const nearY = Math.max(box.y, Math.min(y, box.y + box.h));
    const dx = x - nearX;
    const dy = y - nearY;
    if (dx * dx + dy * dy < radius * radius) return true;
  }
  return false;
}

/** Segment vs. rectangle test (slab method): true when the sight line is blocked. */
export function segmentBlockedByRect(x1, y1, x2, y2, box) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tMin = 0;
  let tMax = 1;
  if (Math.abs(dx) < 1e-9) {
    if (x1 < box.x || x1 > box.x + box.w) return false;
  } else {
    let t1 = (box.x - x1) / dx;
    let t2 = (box.x + box.w - x1) / dx;
    if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return false;
  }
  if (Math.abs(dy) < 1e-9) {
    if (y1 < box.y || y1 > box.y + box.h) return false;
  } else {
    let t1 = (box.y - y1) / dy;
    let t2 = (box.y + box.h - y1) / dy;
    if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return false;
  }
  return tMax > 0.001 && tMin < 0.999;
}

/** True when any occluder blocks the straight line between two points. */
export function lineOfSightBlocked(x1, y1, x2, y2) {
  for (const box of OCCLUDERS) {
    if (segmentBlockedByRect(x1, y1, x2, y2, box)) return true;
  }
  return false;
}

/** Distance from a point to the nearest blocking edge along a ray, for cone drawing. */
export function raycastDistance(x, y, angle, maxDistance) {
  const x2 = x + Math.cos(angle) * maxDistance;
  const y2 = y + Math.sin(angle) * maxDistance;
  let best = maxDistance;
  for (const box of OCCLUDERS) {
    // Sample the segment finely enough for a clean cone silhouette.
    for (let t = 0.02; t <= 1; t += 0.02) {
      const px = x + (x2 - x) * t;
      const py = y + (y2 - y) * t;
      if (px >= box.x && px <= box.x + box.w && py >= box.y && py <= box.y + box.h) {
        const d = maxDistance * t;
        if (d < best) best = d;
        break;
      }
    }
  }
  return best;
}
