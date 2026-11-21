// LAMPLIGHT HARBOR — tiny synthesized sound, no audio files: a soft tick as your
// footsteps land (pitch tells you how loud you are being), a rising blip when a
// guard grows suspicious, and a low sting when the chase starts. Sound starts on
// the first key or click, as browsers require a gesture.

export function createAudio() {
  let context = null;
  let lastTickAt = 0;

  function ensure() {
    if (context) {
      if (context.state === 'suspended') context.resume();
      return context;
    }
    try {
      context = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      context = null;
    }
    return context;
  }

  function tone(freqFrom, freqTo, seconds, type, gainValue) {
    const ctx = ensure();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqFrom, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, freqTo), ctx.currentTime + seconds);
    gain.gain.setValueAtTime(gainValue, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + seconds);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + seconds);
  }

  return {
    unlock() { ensure(); },
    footstep(running) {
      const now = performance.now();
      if (now - lastTickAt < (running ? 280 : 430)) return;
      lastTickAt = now;
      tone(running ? 210 : 150, 90, 0.07, 'triangle', running ? 0.05 : 0.025);
    },
    suspicious() { tone(520, 760, 0.12, 'sine', 0.05); },
    chase() { tone(220, 70, 0.4, 'sawtooth', 0.07); },
    pickup() { tone(660, 990, 0.14, 'sine', 0.06); },
    escaped() { tone(523, 1046, 0.35, 'sine', 0.06); },
  };
}
