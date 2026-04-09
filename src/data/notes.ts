// Note name helpers and enharmonic equivalents

// Pitch class to sharp name
export const SHARP_NAMES: string[] = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'
];

// Pitch class to flat name
export const FLAT_NAMES: string[] = [
  'C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'
];

// Natural pitch classes (no sharps/flats)
export const NATURAL_PCS = new Set([0, 2, 4, 5, 7, 9, 11]); // C D E F G A B

// Accidental pitch classes
export const ACCIDENTAL_PCS = new Set([1, 3, 6, 8, 10]); // C# D# F# G# A#

/**
 * Get the display name(s) for a pitch class given accidental preferences
 */
export function getPitchClassNames(
  pc: number,
  useSharps: boolean,
  useFlats: boolean
): string[] {
  if (NATURAL_PCS.has(pc)) {
    return [SHARP_NAMES[pc]];
  }
  const names: string[] = [];
  if (useSharps) names.push(SHARP_NAMES[pc]);
  if (useFlats) names.push(FLAT_NAMES[pc]);
  if (names.length === 0) {
    // Fallback to both if neither is set
    return [SHARP_NAMES[pc], FLAT_NAMES[pc]];
  }
  return names;
}

/**
 * Get the primary display name for a pitch class
 */
export function getPrimaryName(
  pc: number,
  useSharps: boolean,
  useFlats: boolean
): string {
  if (NATURAL_PCS.has(pc)) return SHARP_NAMES[pc];
  if (useSharps) return SHARP_NAMES[pc];
  if (useFlats) return FLAT_NAMES[pc];
  return SHARP_NAMES[pc]; // fallback
}

/**
 * Parse a note name to its pitch class (0-11)
 */
export function noteNameToPC(name: string): number | null {
  const normalized = name.trim();
  const sharpIdx = SHARP_NAMES.findIndex(n => n === normalized);
  if (sharpIdx >= 0) return sharpIdx;
  const flatIdx = FLAT_NAMES.findIndex(n => n === normalized);
  if (flatIdx >= 0) return flatIdx;
  return null;
}

/**
 * Check if a note name matches a pitch class (considering enharmonics)
 */
export function noteNameMatchesPC(name: string, pc: number): boolean {
  const parsed = noteNameToPC(name);
  return parsed === pc;
}

/**
 * Get all acceptable answer names for a pitch class
 */
export function getAcceptableNames(pc: number): string[] {
  const names = new Set<string>();
  names.add(SHARP_NAMES[pc]);
  names.add(FLAT_NAMES[pc]);
  return Array.from(names);
}

/**
 * All 7 natural note names
 */
export const NATURAL_NAMES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

/**
 * All sharp note names (5 accidentals)
 */
export const SHARP_ACCIDENTAL_NAMES = ['C#', 'D#', 'F#', 'G#', 'A#'];

/**
 * All flat note names (5 accidentals)
 */
export const FLAT_ACCIDENTAL_NAMES = ['Db', 'Eb', 'Gb', 'Ab', 'Bb'];

/**
 * Map from MIDI number to staff position (steps above middle C = MIDI 60 = C4)
 * Returns the diatonic step count from C4. Positive = above, negative = below.
 * Used for staff rendering.
 *
 * Staff positions are in semitones mapped to diatonic steps.
 * C=0, D=1, E=2, F=3, G=4, A=5, B=6 within an octave.
 */
export function midiToStaffPosition(midi: number): number {
  const octave = Math.floor(midi / 12) - 1;
  const pc = midi % 12;

  // Map pitch class to diatonic step (within octave)
  const PC_TO_DIATONIC: Record<number, number> = {
    0: 0,  // C
    1: 0,  // C# -> C line
    2: 1,  // D
    3: 1,  // Eb -> D line
    4: 2,  // E
    5: 3,  // F
    6: 3,  // F# -> F line
    7: 4,  // G
    8: 4,  // Ab -> G line
    9: 5,  // A
    10: 5, // Bb -> A line
    11: 6, // B
  };

  const diatonicStep = PC_TO_DIATONIC[pc];
  // Steps from C4 (middle C)
  // C4 is at octave 4, step 0
  return (octave - 4) * 7 + diatonicStep;
}

/**
 * Get accidental for a pitch class (null = natural, 1 = sharp, -1 = flat)
 * Returns the simpler accidental based on context
 */
export function getAccidental(pc: number, useSharps: boolean): null | 'sharp' | 'flat' {
  if (NATURAL_PCS.has(pc)) return null;
  return useSharps ? 'sharp' : 'flat';
}
