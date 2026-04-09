// Standard guitar tuning: low E to high E
// MIDI numbers: E2=40, A2=45, D3=50, G3=55, B3=59, E4=64

export const STANDARD_TUNING_NAMES = ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'] as const;

// MIDI numbers for open strings (string 0 = low E)
export const OPEN_STRING_MIDI: number[] = [40, 45, 50, 55, 59, 64];

// Pitch classes (0=C) for open strings
// E=4, A=9, D=2, G=7, B=11, E=4
export const OPEN_STRING_PCS: number[] = [4, 9, 2, 7, 11, 4];

// String display labels (high string at top visually, but index 5=high E)
export const STRING_NAMES = ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'];

/**
 * Get the pitch class (0-11) at a given string and fret
 * 0=C, 1=C#/Db, 2=D, 3=D#/Eb, 4=E, 5=F, 6=F#/Gb, 7=G, 8=G#/Ab, 9=A, 10=A#/Bb, 11=B
 */
export function noteAt(stringIndex: number, fret: number): number {
  return (OPEN_STRING_PCS[stringIndex] + fret) % 12;
}

/**
 * Get the MIDI number at a given string and fret
 */
export function midiAt(stringIndex: number, fret: number): number {
  return OPEN_STRING_MIDI[stringIndex] + fret;
}

/**
 * Get octave of a given MIDI note
 */
export function midiToOctave(midi: number): number {
  return Math.floor(midi / 12) - 1;
}
