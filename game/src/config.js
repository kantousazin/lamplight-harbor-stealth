// LAMPLIGHT HARBOR — every tuning number and colour in one place.
// The harbour is a fixed 1280x720 logical area; the renderer scales it to the window.

export const FIELD = { width: 1280, height: 720 };
export const STEP = 1 / 60;

export const PLAYER = {
  radius: 13,
  walkSpeed: 168,
  runSpeed: 285,
  sneakSpeed: 92,
  runNoiseRadius: 150,
  walkNoiseRadius: 46,
  sneakNoiseRadius: 0,
};

export const GUARD = {
  radius: 14,
  patrolSpeed: 74,
  chaseSpeed: 196,
  searchSpeed: 118,
  viewDistance: 252,
  viewDistanceInShadow: 168,
  viewHalfAngle: 0.62,
  catchDistance: 24,
  loseSightSeconds: 2.6,
  waypointWaitSeconds: 1.6,
  turnRate: 3.4,
  chaseTurnRate: 5.2,
};

export const ALERT = {
  fillPerSecondClose: 1.5,
  fillPerSecondFar: 0.45,
  shadowFactor: 0.45,
  sneakFactor: 0.6,
  decayPerSecond: 0.28,
  suspiciousAt: 0.35,
};

export const PALETTE = {
  night: '#0b1220',
  water: '#0e2233',
  waterLine: '#16405c',
  dock: '#233246',
  dockEdge: '#31465f',
  crate: '#8a6b3f',
  crateEdge: '#c49a58',
  barrel: '#5d7d8c',
  barrelEdge: '#93b7c6',
  wall: '#3d4c66',
  wallEdge: '#5f7699',
  lampCore: '#ffd98a',
  guardBody: '#e8ecf4',
  guardCap: '#d84b3f',
  playerBody: '#57d7c5',
  playerScarf: '#ffdf6b',
  exitGlow: '#6bffb8',
  text: '#eef3fa',
  muted: '#93a5bd',
  danger: '#ff5347',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';
export const BEST_KEY = 'lamplight-harbor.best';
