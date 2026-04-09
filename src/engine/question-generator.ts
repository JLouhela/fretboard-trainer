// Question generator: given an ExerciseConfig, generates Question objects
import { ExerciseConfig } from '../data/exercises';
import { noteAt, midiAt } from '../data/tuning';
import { NATURAL_PCS, SHARP_NAMES, FLAT_NAMES, getAcceptableNames } from '../data/notes';
import { computeWeight } from './stats';

export type Question = {
  prompt: ExerciseConfig['prompt'];
  stringIndex: number;
  fret: number;
  midi: number;
  correctName: string;
  acceptableNames: string[];
};

/**
 * Gather all valid (string, fret) positions for an exercise config.
 */
function gatherPositions(
  config: ExerciseConfig
): Array<{ stringIndex: number; fret: number }> {
  const positions: Array<{ stringIndex: number; fret: number }> = [];
  const [minFret, maxFret] = config.fretRange;

  for (const stringIndex of config.strings) {
    for (let fret = minFret; fret <= maxFret; fret++) {
      const pc = noteAt(stringIndex, fret);
      if (!config.includeAccidentals && !NATURAL_PCS.has(pc)) {
        continue;
      }
      positions.push({ stringIndex, fret });
    }
  }
  return positions;
}

/**
 * Pick a random position with optional spaced-repetition weighting.
 */
function pickPosition(
  positions: Array<{ stringIndex: number; fret: number }>,
  exerciseId: string,
  weighting: ExerciseConfig['weighting'],
  useSharps: boolean
): { stringIndex: number; fret: number } {
  if (positions.length === 0) {
    throw new Error('No valid positions for this exercise configuration');
  }

  if (weighting === 'spaced-repetition') {
    const weights = positions.map(p =>
      computeWeight(exerciseId, p.stringIndex, p.fret)
    );
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let rand = Math.random() * totalWeight;
    for (let i = 0; i < positions.length; i++) {
      rand -= weights[i];
      if (rand <= 0) return positions[i];
    }
    return positions[positions.length - 1];
  }

  // Uniform
  return positions[Math.floor(Math.random() * positions.length)];
}

const RANDOM_MIX_PROMPTS: ExerciseConfig['prompt'][] = [
  'position-to-name',
  'position-to-name',
  'name-to-position',
  'staff-to-position',
];

/**
 * Generate a sequence of questions for an exercise.
 */
export function generateQuestions(
  config: ExerciseConfig,
  count: number,
  useSharps: boolean
): Question[] {
  const positions = gatherPositions(config);
  if (positions.length === 0) return [];

  const questions: Question[] = [];
  let lastKey = '';

  for (let i = 0; i < count; i++) {
    // Avoid repeating the same position twice in a row
    let pos: { stringIndex: number; fret: number };
    let attempts = 0;
    do {
      pos = pickPosition(positions, config.id, config.weighting, useSharps);
      attempts++;
    } while (
      `${pos.stringIndex}:${pos.fret}` === lastKey &&
      positions.length > 1 &&
      attempts < 10
    );
    lastKey = `${pos.stringIndex}:${pos.fret}`;

    const pc = noteAt(pos.stringIndex, pos.fret);
    const midi = midiAt(pos.stringIndex, pos.fret);

    // Primary name based on useSharps preference
    const correctName = useSharps
      ? SHARP_NAMES[pc]
      : FLAT_NAMES[pc];

    const acceptableNames = getAcceptableNames(pc);

    // For random-mix, alternate prompt types
    let prompt = config.prompt;
    if (config.id === 'random-mix') {
      prompt = RANDOM_MIX_PROMPTS[i % RANDOM_MIX_PROMPTS.length];
    }

    questions.push({
      prompt,
      stringIndex: pos.stringIndex,
      fret: pos.fret,
      midi,
      correctName,
      acceptableNames,
    });
  }

  return questions;
}

/**
 * Check if a user's answer is correct for a question.
 */
export function checkAnswer(question: Question, userAnswer: string): boolean {
  const normalized = userAnswer.trim();
  return question.acceptableNames.some(
    name => name.toLowerCase() === normalized.toLowerCase()
  );
}

/**
 * Check if a (string, fret) tap is correct for a name-to-position question.
 */
export function checkPositionAnswer(
  question: Question,
  stringIndex: number,
  fret: number
): boolean {
  const pc = noteAt(stringIndex, fret);
  const questionPc = noteAt(question.stringIndex, question.fret);
  return pc === questionPc;
}
