// Web Audio API synthesizer
// AudioContext created lazily on first user gesture (iOS requirement)

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext();
  }
  // Resume if suspended (browser autoplay policy)
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  return ctx;
}

/**
 * Play a note at the given MIDI pitch
 */
export function playNote(midi: number, durationMs = 500): void {
  try {
    const c = getCtx();
    const freq = 440 * Math.pow(2, (midi - 69) / 12);
    const osc = c.createOscillator();
    const gain = c.createGain();

    osc.type = 'triangle';
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0, c.currentTime);
    gain.gain.linearRampToValueAtTime(0.25, c.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + durationMs / 1000);

    osc.connect(gain);
    gain.connect(c.destination);

    osc.start();
    osc.stop(c.currentTime + durationMs / 1000 + 0.05);
  } catch (e) {
    // Silently fail if audio is not available
    console.warn('Audio playback failed:', e);
  }
}

/**
 * Play feedback sound: high ping for correct, low buzz for wrong
 */
export function playFeedback(correct: boolean): void {
  try {
    const c = getCtx();
    const freq = correct ? 880 : 220;
    const durationMs = 120;

    const osc = c.createOscillator();
    const gain = c.createGain();

    if (correct) {
      osc.type = 'sine';
      gain.gain.setValueAtTime(0, c.currentTime);
      gain.gain.linearRampToValueAtTime(0.3, c.currentTime + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + durationMs / 1000);
    } else {
      // Distorted buzz for wrong
      osc.type = 'sawtooth';
      gain.gain.setValueAtTime(0, c.currentTime);
      gain.gain.linearRampToValueAtTime(0.15, c.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + durationMs / 1000);
    }

    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(c.destination);

    osc.start();
    osc.stop(c.currentTime + durationMs / 1000 + 0.05);
  } catch (e) {
    console.warn('Audio feedback failed:', e);
  }
}

/**
 * Initialize audio context on first user gesture
 * Call this from a click handler
 */
export function initAudio(): void {
  getCtx();
}
