export type PromptType =
  | 'position-to-name'
  | 'name-to-position'
  | 'staff-to-position'
  | 'staff-to-name';

export type ExerciseConfig = {
  id: string;
  title: string;
  description: string;
  icon?: string;
  prompt: PromptType;
  strings: number[];        // which strings to generate questions from
  displayStrings?: number[]; // which strings to show on the fretboard (defaults to strings)
  fretRange: [number, number];
  includeAccidentals: boolean;
  questionCount: number;
  timeLimitMs?: number;
  weighting?: 'uniform' | 'spaced-repetition';
};

const ALL_STRINGS = [0, 1, 2, 3, 4, 5];

export const EXERCISES: ExerciseConfig[] = [
  {
    id: 'low-e-naturals',
    title: 'Low E String',
    description: 'Natural notes on the low E string (frets 0–12)',
    icon: '1️⃣',
    prompt: 'position-to-name',
    strings: [0],
    displayStrings: ALL_STRINGS,
    fretRange: [1, 12],
    includeAccidentals: false,
    questionCount: 10,
    weighting: 'spaced-repetition',
  },
  {
    id: 'a-string-naturals',
    title: 'A String',
    description: 'Natural notes on the A string (frets 0–12)',
    icon: '2️⃣',
    prompt: 'position-to-name',
    strings: [1],
    displayStrings: ALL_STRINGS,
    fretRange: [1, 12],
    includeAccidentals: false,
    questionCount: 10,
    weighting: 'spaced-repetition',
  },
  {
    id: 'd-string-naturals',
    title: 'D String',
    description: 'Natural notes on the D string (frets 0–12)',
    icon: '3️⃣',
    prompt: 'position-to-name',
    strings: [2],
    displayStrings: ALL_STRINGS,
    fretRange: [1, 12],
    includeAccidentals: false,
    questionCount: 10,
    weighting: 'spaced-repetition',
  },
  {
    id: 'g-string-naturals',
    title: 'G String',
    description: 'Natural notes on the G string (frets 0–12)',
    icon: '4️⃣',
    prompt: 'position-to-name',
    strings: [3],
    displayStrings: ALL_STRINGS,
    fretRange: [1, 12],
    includeAccidentals: false,
    questionCount: 10,
    weighting: 'spaced-repetition',
  },
  {
    id: 'b-string-naturals',
    title: 'B String',
    description: 'Natural notes on the B string (frets 0–12)',
    icon: '5️⃣',
    prompt: 'position-to-name',
    strings: [4],
    displayStrings: ALL_STRINGS,
    fretRange: [1, 12],
    includeAccidentals: false,
    questionCount: 10,
    weighting: 'spaced-repetition',
  },
  {
    id: 'high-e-naturals',
    title: 'High E String',
    description: 'Natural notes on the high E string (frets 0–12)',
    icon: '6️⃣',
    prompt: 'position-to-name',
    strings: [5],
    displayStrings: ALL_STRINGS,
    fretRange: [1, 12],
    includeAccidentals: false,
    questionCount: 10,
    weighting: 'spaced-repetition',
  },
  {
    id: 'low-position-naturals',
    title: 'Low Position (0–5)',
    description: 'Natural notes across all strings, frets 0–5',
    icon: '📍',
    prompt: 'position-to-name',
    strings: ALL_STRINGS,
    fretRange: [1, 5],
    includeAccidentals: false,
    questionCount: 15,
    weighting: 'spaced-repetition',
  },
  {
    id: 'mid-position-naturals',
    title: 'Mid Position (5–12)',
    description: 'Natural notes across all strings, frets 5–12',
    icon: '📌',
    prompt: 'position-to-name',
    strings: ALL_STRINGS,
    fretRange: [5, 12],
    includeAccidentals: false,
    questionCount: 15,
    weighting: 'spaced-repetition',
  },
  {
    id: 'full-fretboard-naturals',
    title: 'Full Fretboard',
    description: 'Natural notes across the entire fretboard',
    icon: '🎯',
    prompt: 'position-to-name',
    strings: ALL_STRINGS,
    fretRange: [1, 12],
    includeAccidentals: false,
    questionCount: 20,
    weighting: 'spaced-repetition',
  },
  {
    id: 'find-the-note',
    title: 'Find the Note',
    description: 'Given a note name, tap the correct fret position',
    icon: '🔍',
    prompt: 'name-to-position',
    strings: ALL_STRINGS,
    fretRange: [1, 12],
    includeAccidentals: false,
    questionCount: 15,
    weighting: 'spaced-repetition',
  },
  {
    id: 'staff-to-fretboard',
    title: 'Staff → Fretboard',
    description: 'Read a note on the staff and find it on the fretboard',
    icon: '🎼',
    prompt: 'staff-to-position',
    strings: ALL_STRINGS,
    fretRange: [1, 12],
    includeAccidentals: false,
    questionCount: 15,
    weighting: 'spaced-repetition',
  },
  {
    id: 'staff-to-name',
    title: 'Staff → Name',
    description: 'Read a note on the staff and name it',
    icon: '🎵',
    prompt: 'staff-to-name',
    strings: ALL_STRINGS,
    fretRange: [1, 12],
    includeAccidentals: false,
    questionCount: 15,
    weighting: 'spaced-repetition',
  },
  {
    id: 'with-accidentals',
    title: 'With Accidentals',
    description: 'All notes including sharps and flats across the full fretboard',
    icon: '♯',
    prompt: 'position-to-name',
    strings: ALL_STRINGS,
    fretRange: [1, 12],
    includeAccidentals: true,
    questionCount: 20,
    weighting: 'spaced-repetition',
  },
  {
    id: 'random-mix',
    title: 'Random Mix',
    description: 'A variety of different question types',
    icon: '🎲',
    prompt: 'position-to-name', // overridden per question
    strings: ALL_STRINGS,
    fretRange: [1, 12],
    includeAccidentals: false,
    questionCount: 20,
    weighting: 'spaced-repetition',
  },
];

export function getExerciseById(id: string): ExerciseConfig | undefined {
  return EXERCISES.find(e => e.id === id);
}

export const RANDOM_EXERCISE_ID = 'random-mix';
