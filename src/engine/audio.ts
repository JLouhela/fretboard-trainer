// Web Audio API synthesizer
// AudioContext created lazily on first user gesture (iOS requirement)

import { settings } from '../store';

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
  if (!settings.value.audioEnabled) return;
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
 * Play feedback as a chord built on the current note.
 * Correct → major chord (root + M3 + P5), strummed upward.
 * Wrong   → minor chord (root + m3 + P5), strummed upward.
 */
export function playFeedback(correct: boolean, midi: number): void {
  if (!settings.value.audioEnabled) return;
  try {
    const c = getCtx();
    const semitones = correct ? [0, 4, 7] : [0, 3, 7];
    const durationMs = 700;
    const strumDelayS = 0.04; // 40 ms between each string

    semitones.forEach((interval, i) => {
      const freq = 440 * Math.pow(2, (midi + interval - 69) / 12);
      const t0 = c.currentTime + i * strumDelayS;

      const osc = c.createOscillator();
      const gain = c.createGain();

      osc.type = 'triangle';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(0.18, t0 + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + durationMs / 1000);

      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(t0);
      osc.stop(t0 + durationMs / 1000 + 0.05);
    });
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
