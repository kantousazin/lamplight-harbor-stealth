// LAMPLIGHT HARBOR — keyboard and mouse input: WASD / arrows to move, Shift to
// run, C or Ctrl to sneak, Space / Enter to confirm, P or Esc to pause, R to retry.

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_RETRY = 4;

export function createInput(canvas) {
  const keys = new Set();
  let actions = 0;

  window.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) event.preventDefault();
    keys.add(event.code);
    if (event.code === 'Space' || event.code === 'Enter') actions |= ACTION_CONFIRM;
    if (event.code === 'KeyP' || event.code === 'Escape') actions |= ACTION_PAUSE;
    if (event.code === 'KeyR') actions |= ACTION_RETRY;
  });
  window.addEventListener('keyup', (event) => keys.delete(event.code));
  canvas.addEventListener('pointerdown', () => { actions |= ACTION_CONFIRM; });

  return {
    direction() {
      let x = 0;
      let y = 0;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) x -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) x += 1;
      if (keys.has('KeyW') || keys.has('ArrowUp')) y -= 1;
      if (keys.has('KeyS') || keys.has('ArrowDown')) y += 1;
      return {
        x,
        y,
        run: keys.has('ShiftLeft') || keys.has('ShiftRight'),
        sneak: keys.has('KeyC') || keys.has('ControlLeft') || keys.has('ControlRight'),
      };
    },
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
  };
}
