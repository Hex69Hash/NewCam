// Audio synthesizer using Web Audio API for camera shutter and timer beeps
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Play a synthetic camera shutter click
 */
export function playShutterSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Mechanical click 1
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(320, now);
  osc1.frequency.exponentialRampToValueAtTime(80, now + 0.04);
  gain1.gain.setValueAtTime(0.7, now);
  gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.05);

  // Mechanical click 2 (rebound)
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  const delay = 0.07;
  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(450, now + delay);
  osc2.frequency.exponentialRampToValueAtTime(120, now + delay + 0.05);
  gain2.gain.setValueAtTime(0.5, now + delay);
  gain2.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.05);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now + delay);
  osc2.stop(now + delay + 0.06);
}

/**
 * Play countdown timer beep
 */
export function playTimerBeep(isFinal = false): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  const freq = isFinal ? 1320 : 880;
  const duration = isFinal ? 0.18 : 0.08;

  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, now);
  gain.gain.setValueAtTime(0.4, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + duration + 0.01);
}

/**
 * Provide subtle haptic vibration on mobile devices
 */
export function triggerHaptic(type: 'light' | 'medium' | 'shutter' = 'light'): void {
  try {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      if (type === 'light') {
        navigator.vibrate(10);
      } else if (type === 'medium') {
        navigator.vibrate(25);
      } else if (type === 'shutter') {
        navigator.vibrate([35, 30, 45]);
      }
    }
  } catch {
    // Ignore lack of permissions or unsupported browser
  }
}
